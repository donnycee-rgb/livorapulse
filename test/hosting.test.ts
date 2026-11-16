// Guards against the blank-page bug of November 2026, so it can't come back
// quietly. What happened: the host answers a missing app file with
// index.html (single-page app fallback), and public/_headers gave every
// /assets/* response "max-age=1 year, immutable". So a browser that once got
// HTML for a JavaScript file kept it for a year, and the app stayed blank.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

describe('hosting rules that keep the app from going blank', () => {
  it('never gives any path a long or immutable browser cache', () => {
    const lines = read('public/_headers').split('\n').map((l) => l.trim()).filter((l) => !l.startsWith('#'))
    const cacheRules = lines.filter((l) => /^cache-control:/i.test(l))
    for (const rule of cacheRules) {
      expect(rule, rule).not.toMatch(/immutable/i)
      const maxAge = Number(/max-age=(\d+)/i.exec(rule)?.[1] ?? 0)
      expect(maxAge, rule).toBeLessThanOrEqual(3600)
    }
  })

  it('the service worker never keeps HTML as an app file', () => {
    const sw = read('public/sw.js')
    expect(sw).toMatch(/function isRealFile/)
    expect(sw).toMatch(/text\/html/)
    // app files are fetched past the browser's own cache when it's wrong
    expect(sw).toMatch(/cache: 'no-cache'/)
    expect(sw).toMatch(/cache: 'reload'/)
    expect(sw).toMatch(/__LP_ASSETS__/)
  })

  it('the page recovers by itself if an app file fails to load', () => {
    const html = read('index.html')
    const recovery = html.indexOf('lp-recovered-at')
    const entry = html.indexOf('type="module"')
    expect(recovery).toBeGreaterThan(-1)
    expect(recovery).toBeLessThan(entry) // it must run before the app's script
    expect(html).toMatch(/cache: 'reload'/)
    expect(html).toMatch(/__LP_ASSETS__/)
  })

  it('builds into the same folder the worker and the page watch', () => {
    const config = read('vite.config.ts')
    expect(config).toMatch(/assetsDir: ASSETS_DIR/)
    expect(config).toMatch(/replaceAll\('__LP_ASSETS__', ASSETS_DIR\)/)
  })
})
