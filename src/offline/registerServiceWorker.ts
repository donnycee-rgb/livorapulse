/**
 * Registers the service worker (public/sw.js) that keeps the app's files on
 * the phone, so LivoraPulse opens with no connection. Production only: in
 * development it would serve stale files while editing.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => null) // the app works without it, just not offline
  })
}
