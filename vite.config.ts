import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { computeVersionInfo } from './scripts/lib/version-info.mjs'

const release = process.env.TAURI_RELEASE === '1' || process.env.RELEASE === '1'
const versionInfo = computeVersionInfo({ release })

// GitHub Pages: /aaism-study-app/ · Tauri/local dev: /
const base = process.env.GITHUB_PAGES === 'true' ? '/aaism-study-app/' : '/'
const isTauri = process.env.TAURI === 'true' || process.env.TAURI_ENV_PLATFORM != null

/** Stub PWA virtual module when building for Tauri (no service worker needed). */
function tauriPwaStub() {
  return {
    name: 'tauri-pwa-stub',
    resolveId(id: string) {
      if (id === 'virtual:pwa-register') return id
    },
    load(id: string) {
      if (id === 'virtual:pwa-register') {
        return 'export function registerSW() { return () => {} }'
      }
    },
  }
}

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(versionInfo.displayVersion),
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(versionInfo.gitHash),
    'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(versionInfo.buildDate),
    'import.meta.env.VITE_BUNDLE_ID': JSON.stringify('com.aegis.app'),
  },
  plugins: [
    react(),
    ...(isTauri ? [tauriPwaStub()] : []),
    ...(!isTauri
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'logo.svg', 'aaism-logo.svg', 'apple-touch-icon.png', '404.html'],
            manifest: {
              name: versionInfo.pwaName,
              short_name: versionInfo.pwaName,
              description: 'Multi-cert study, ops drills, intel feeds, and AI-assisted exam prep',
              theme_color: '#059669',
              background_color: '#111827',
              display: 'standalone',
              start_url: base,
              scope: base,
              icons: [
                { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
                { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'maskable' },
                { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,webp}'],
              runtimeCaching: [
                {
                  urlPattern: /\.(?:json)$/i,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'aaism-json-cache',
                    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
})
