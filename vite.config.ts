import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages project site: https://<user>.github.io/aaism-study-app/
const base = process.env.GITHUB_PAGES === 'true' ? '/aaism-study-app/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'aaism-logo.svg', '404.html'],
      manifest: {
        name: 'AAISM Study App',
        short_name: 'AAISM',
        description: 'AI Security Manager exam prep — offline study shell with cached content',
        theme_color: '#059669',
        background_color: '#111827',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
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
  ],
})
