// ─── LivoraPulse service worker: open the app without a connection ──────────
// The build (vite.config.ts) fills in VERSION, the files folder (ASSETS) and
// the list of app files below.
// - Pages: from the network, or the saved app if there's no signal (or it's
//   too slow), so the app always opens.
// - App files (/app/..., hashed names that never change): saved once, served
//   from the phone.
// - Food scan model (/models): saved the first time someone scans.
// - The API is never cached here: logs made offline wait in the app's own
//   queue (src/offline/outbox.ts) and upload later.
//
// One rule above all: an app file is only ever used if it really is that
// file. The host answers a missing path with the app's HTML page (the
// single-page app fallback), for example an old version's file after a
// deploy. HTML under a JavaScript file's name gives a blank page, so:
//   - it's never saved here,
//   - the browser's own cache is never trusted blindly (files are fetched
//     with "no-cache", so the browser checks with the server), and
//   - if HTML still comes back, the file is fetched once more bypassing the
//     browser cache entirely ("reload"), which also overwrites a bad copy.

const VERSION = '__LP_VERSION__'
const ASSETS = '/__LP_ASSETS__/'
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

/** Fetch an app file: checked with the server, and once more from scratch if HTML comes back */
async function fetchFile(request) {
  const res = await fetch(request, { cache: 'no-cache' })
  if (isRealFile(res) || !res.ok) return res
  return fetch(request, { cache: 'reload' })
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL)
    // One by one, checked, and never failing the install: a file that can't
    // be fetched cleanly now is simply fetched later when it's needed
    await Promise.all(PRECACHE.map(async (path) => {
      try {
        const res = path === '/' ? await fetch(path, { cache: 'no-cache' }) : await fetchFile(new Request(path))
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
    // Always the latest page from the server, never the browser's copy. (By
    // URL: a navigation request can't be copied with new options.)
    const res = await withTimeout(fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }), NAV_TIMEOUT_MS)
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
  const res = await fetchFile(request)
  if (isRealFile(res)) {
    cache.put(request, res.clone())
    return res
  }
  // Still HTML: the file really is gone (an old version's file after a
  // deploy). Don't pass HTML off as JavaScript: fail cleanly so the page's
  // recovery script reloads onto the current version.
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
  else if (url.pathname.startsWith(ASSETS) || url.pathname.startsWith('/assets/')) event.respondWith(cacheFirst(request, SHELL))
  else if (url.pathname.startsWith('/models/')) event.respondWith(cacheFirst(request, MODELS))
  else event.respondWith(staleWhileRevalidate(request))
})

// ─── Phone notifications (sleep reminders) ──────────────────────────────────
// The server sends { title, body, url, tag, actions } through the browser's
// push service; this shows it even when LivoraPulse is closed. Tapping it (or
// one of its buttons) opens the app at that place, or focuses an open window.

self.addEventListener('push', (event) => {
  let msg = { title: 'LivoraPulse', body: '', url: '/dashboard' }
  try { msg = { ...msg, ...event.data.json() } } catch (_) { /* not JSON: show the default */ }
  const actions = Array.isArray(msg.actions) ? msg.actions.slice(0, 2) : []
  event.waitUntil(self.registration.showNotification(msg.title, {
    body: msg.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: msg.tag,
    renotify: Boolean(msg.tag),
    data: { url: msg.url, actions: Object.fromEntries(actions.map((a) => [a.action, a.url])) },
    actions: actions.map((a) => ({ action: a.action, title: a.title })),
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const path = (event.action && data.actions && data.actions[event.action]) || data.url || '/dashboard'
  const target = new URL(path, self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
    if (open) {
      await open.focus()
      return open.navigate(target)
    }
    return self.clients.openWindow(target)
  })())
})
