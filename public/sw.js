// ─── LivoraPulse service worker: open the app without a connection ──────────
// The build (vite.config.ts) fills in VERSION and the list of app files below.
// - Pages: from the network, or the saved app if there's no signal (or it's
//   too slow), so the app always opens.
// - App files (/assets, hashed names that never change): saved once, served
//   from the phone.
// - Food scan model (/models): saved the first time someone scans.
// - The API is never cached here: logs made offline wait in the app's own
//   queue (src/offline/outbox.ts) and upload later.

const VERSION = '__LP_VERSION__'
const PRECACHE = ['__LP_PRECACHE__']

const SHELL = `lp-shell-${VERSION}`
const RUNTIME = 'lp-runtime'
const MODELS = 'lp-models'
const NAV_TIMEOUT_MS = 3500

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Keep this version and the one before it: a tab still running the
    // previous version may yet load one of its pages
    const shells = (await caches.keys()).filter((k) => k.startsWith('lp-shell-')).sort()
    const keep = new Set([SHELL, ...shells.filter((k) => k !== SHELL).slice(-1)])
    await Promise.all(shells.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
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
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS)
    if (res.ok) {
      const cache = await caches.open(RUNTIME)
      cache.put('/', res.clone())
    }
    return res
  } catch {
    // Every page is the same app (index.html); the app shows the right one
    return (await caches.match('/', { ignoreSearch: true })) || Response.error()
  }
}

async function cacheFirst(request, cacheName) {
  const hit = await caches.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone())
  return res
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME)
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
