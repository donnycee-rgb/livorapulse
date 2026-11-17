import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// lib/push reads the browser, so each case loads it with a stand-in browser
async function load(opts: { ua: string; push: boolean; standalone?: boolean }) {
  vi.resetModules()
  const win: Record<string, unknown> = {
    matchMedia: () => ({ matches: !!opts.standalone, addEventListener: () => {} }),
    addEventListener: () => {},
  }
  if (opts.push) { win.PushManager = function PushManager() {}; win.Notification = { permission: 'default' } }
  vi.stubGlobal('window', win)
  vi.stubGlobal('navigator', { userAgent: opts.ua, maxTouchPoints: 0, ...(opts.push ? { serviceWorker: {} } : {}) })
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} })
  return import('../src/lib/push')
}
afterEach(() => vi.unstubAllGlobals())

const ANDROID = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1'

describe('which phones can get reminders', () => {
  it('Android Chrome: yes', async () => {
    expect((await load({ ua: ANDROID, push: true })).pushSupport()).toBe('ok')
  })
  it('iPhone in Safari: install the app first', async () => {
    expect((await load({ ua: IPHONE, push: false })).pushSupport()).toBe('install-first')
  })
  it('installed iPhone app: yes', async () => {
    expect((await load({ ua: IPHONE, push: true, standalone: true })).pushSupport()).toBe('ok')
  })
  it('an old browser without push: no', async () => {
    expect((await load({ ua: ANDROID, push: false })).pushSupport()).toBe('unsupported')
  })
})

describe('the service worker shows notifications', () => {
  const sw = readFileSync(join(root, 'public/sw.js'), 'utf8')
  it('handles a push and a tap on it', () => {
    expect(sw).toMatch(/addEventListener\('push'/)
    expect(sw).toMatch(/addEventListener\('notificationclick'/)
    expect(sw).toMatch(/showNotification/)
  })
  it('has its status-bar badge and icon', () => {
    expect(existsSync(join(root, 'public/icons/badge-96.png'))).toBe(true)
    expect(existsSync(join(root, 'public/icons/icon-192.png'))).toBe(true)
  })
})
