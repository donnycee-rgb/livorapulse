import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Where the built JavaScript and CSS go (/app/...). Moved from Vite's default
 * /assets/ in November 2026 so that every file got a new address: browsers
 * that had cached HTML under an old /assets/ name for a year (see
 * public/_headers) never ask for those names again. public/sw.js and the
 * recovery script in index.html use the same folder (__LP_ASSETS__).
 */
export const ASSETS_DIR = 'app'

/**
 * Fills in public/sw.js after a build: a version (so phones pick up the new
 * app), the files folder, and the list of files to keep for offline use. The
 * food scan model (~10 MB) isn't on the list; it's saved the first time
 * someone scans.
 */
function serviceWorkerManifest(): Plugin {
  let outDir = 'dist'
  return {
    name: 'livorapulse-sw-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const assets = readdirSync(join(outDir, ASSETS_DIR)).map((f) => `/${ASSETS_DIR}/${f}`)
      const files = [
        '/',
        '/manifest.webmanifest',
        '/logos/mark.svg',
        '/logos/1.svg',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        ...assets,
      ]
      const swPath = join(outDir, 'sw.js')
      const sw = readFileSync(swPath, 'utf8')
        .replace('__LP_VERSION__', String(Date.now()))
        .replace("['__LP_PRECACHE__']", JSON.stringify(files))
        .replaceAll('__LP_ASSETS__', ASSETS_DIR)
      if (sw.includes('__LP_')) throw new Error('sw.js still has a placeholder after the build')
      writeFileSync(swPath, sw)

      const htmlPath = join(outDir, 'index.html')
      const html = readFileSync(htmlPath, 'utf8').replaceAll('__LP_ASSETS__', ASSETS_DIR)
      if (html.includes('__LP_')) throw new Error('index.html still has a placeholder after the build')
      writeFileSync(htmlPath, html)
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorkerManifest()],
  build: {
    assetsDir: ASSETS_DIR,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
