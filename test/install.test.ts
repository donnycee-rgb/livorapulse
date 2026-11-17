import { beforeEach, describe, expect, it, vi } from 'vitest'

// A small stand-in for the browser (tests run in Node)
let store: Record<string, string>
let win: EventTarget & { matchMedia: () => { matches: boolean; addEventListener: () => void } }

// lib/install reads the browser when it loads, so each test loads it fresh
const load = async (ua: string) => {
  vi.resetModules()
  win = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false, addEventListener: () => {} }) })
  vi.stubGlobal('window', win)
  vi.stubGlobal('navigator', { userAgent: ua, maxTouchPoints: 0 })
  return import('../src/lib/install')
}
const CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'

beforeEach(() => {
  store = {}
  vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v } })
})

describe('how to install on this phone', () => {
  it("uses the browser's own dialog once it offers one", async () => {
    const m = await load(CHROME)
    expect(m.installWay()).toBe('menu')
    const e = Object.assign(new Event('beforeinstallprompt'), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'accepted' as const }) })
    win.dispatchEvent(e)
    expect(m.installWay()).toBe('prompt')
    expect(await m.promptInstall()).toBe(true)
    expect(e.prompt).toHaveBeenCalled()
  })

  it('iPhone: the Share steps', async () => {
    const m = await load('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')
    expect(m.installWay()).toBe('ios')
  })

  it("inside TikTok or Instagram: open in a real browser first", async () => {
    expect((await load(`${CHROME} musical_ly_2023`)).installWay()).toBe('in-app')
    expect((await load(`${CHROME} Instagram 300.0`)).installWay()).toBe('in-app')
  })
})

describe('the reminder on Home', () => {
  it('waits for 3 different days of use, and stays gone once closed', async () => {
    const m = await load(CHROME)
    expect(m.noteUseDay('2026-11-17')).toBe(1)
    expect(m.noteUseDay('2026-11-17')).toBe(1)
    expect(m.noteUseDay('2026-11-18')).toBe(2)
    expect(m.noteUseDay('2026-11-20')).toBe(3)
    expect(m.nudgeHidden()).toBe(false)
    m.hideNudge()
    expect(m.nudgeHidden()).toBe(true)
  })
})
