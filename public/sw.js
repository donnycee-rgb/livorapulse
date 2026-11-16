// ─── LivoraPulse service worker: open the app without a connection ──────────
// The build (vite.config.ts) fills in VERSION and the list of app files below.
// - Pages: from the network, or the saved app if there's no signal (or it's
//   too slow), so the app always opens.
// - App files (/assets, hashed names that never change): saved once, served
//   from the phone.
// - Food scan model (/models): saved the first time someone scans.
// - The API is never cached here: logs made offline wait in the app's own
//   queue (src/offline/outbox.ts) and upload later.
//
// One rule above all: an app file is only saved if it really is that file.
// A host answers an unknown path with the app's HTML page (single-page app
// fallback), e.g. for a moment during a deploy. Saving that HTML under a
// JavaScript file's name breaks the app until the cache is cleared, so
// anything that comes back as HTML for /assets or /models is never saved.

const VERSION = '__LP_VERSION__'
const PRECACHE = ['__LP_PRECACHE__']

const SHELL = `lp-shell-${VERSION}`
const MODELS = 'lp-models'
const NAV_TIMEOUT_MS = 3500

/** True when a response is the real file, not the app's HTML page standing in for it */
function isRealFile(res) {
  if (!res || !res.ok) return false
  const type = res.headers.get('content-type') || ''
  return !type.includes('text/html')
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    // One by one, checked, and never failing the install: a file that can't
    // be fetched cleanly now is simply fetched later when it's needed
    await Promise.all(PRECACHE.map(async (path) => {
      try {
        const res = await fetch(path, { cache: 'no-cache' })
        if (path === '/' ? res.ok : isRealFile(res)) await cache.put(path, res)
      } catch { /* offline or a bad response: skip */ }
    }))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Keep only this version's files and the food model; everything else
    // (older versions, and any bad copy saved by an earlier version) goes
    const keep = new Set([SHELL, MODELS])
    await Promise.all((await caches.keys()).filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then((v) => { clearTimeout(t); resolve(v) }, (e) => { clearTimeout(t); reject(e) })
  })
}

async function page(request) {
  const cache = await caches.open(SHELL)
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS)
    if (res.ok) cache.put('/', res.clone())
    return res
  } catch {
    // No signal, or too slow: every page is the same app (index.html)
    return (await cache.match('/')) || Response.error()
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (isRealFile(hit)) return hit
  if (hit) await cache.delete(request) // a bad copy from before: drop it
  const res = await fetch(request)
  if (isRealFile(res)) {
    cache.put(request, res.clone())
    return res
  }
  // The host sent its HTML page for a missing app file (an old version's
  // file after a deploy). Don't pass HTML off as JavaScript: fail cleanly so
  // the app reloads itself onto the current version.
  return res.ok ? new Response('', { status: 404, statusText: 'Not Found' }) : res
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL)
  const hit = await cache.match(request)
  const fresh = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone())
    return res
  }).catch(() => hit || Response.error())
  return hit || fresh
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // the API and other sites: straight to the network
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') event.respondWith(page(request))
  else if (url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request, SHELL))
  else if (url.pathname.startsWith('/models/')) event.respondWith(cacheFirst(request, MODELS))
  else event.respondWith(staleWhileRevalidate(request))
})
