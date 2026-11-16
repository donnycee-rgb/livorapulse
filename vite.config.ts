import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Fills in public/sw.js after a build: a version (so phones pick up the new
 * app) and the list of files to keep for offline use. The food scan model
 * (~10 MB) isn't on the list; it's saved the first time someone scans.
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
      const assets = readdirSync(join(outDir, 'assets')).map((f) => `/assets/${f}`)
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
      writeFileSync(swPath, sw)
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorkerManifest()],
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
