import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const buildTimestamp = new Date()
  .toISOString()
  .replace(/[-:T.]/g, '')
  .slice(0, 14)

const addBuildTimestampToAssets = () => ({
  name: 'add-build-timestamp-to-assets',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html: string) {
    return html.replace(/(src|href)="([^"]+)"/g, (match, attribute, value) => {
      if (!/\.(js|css|webmanifest)(\?.*)?$/.test(value)) {
        return match
      }

      if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('//') ||
        value.startsWith('data:')
      ) {
        return match
      }

      const separator = value.includes('?') ? '&' : '?'
      return `${attribute}="${value}${separator}x=${buildTimestamp}"`
    })
  },
})

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/gym-pilot/' : '/',

  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${buildTimestamp}.js`,
        chunkFileNames: `assets/[name]-[hash]-${buildTimestamp}.js`,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return `assets/[name]-[hash]-${buildTimestamp}.css`
          }

          return `assets/[name]-[hash]-${buildTimestamp}[extname]`
        },
      },
    },
  },

  plugins: [
    react(),
    tailwindcss(),
    addBuildTimestampToAssets(),

    VitePWA({
      registerType: 'autoUpdate',

      // Prevent service worker problems during development
      devOptions: {
        enabled: false,
      },

      includeAssets: ['favicon.svg', 'app-icon.svg'],

      manifest: {
        name: 'Gym-Pilot',
        short_name: 'Gym-Pilot',
        description: 'Gym tracking app',

        theme_color: '#863bff',
        background_color: '#ffffff',

        display: 'standalone',

        start_url: '/gym-pilot/',
        scope: '/gym-pilot/',

        icons: [
          {
            src: '/gym-pilot/app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

        clientsClaim: true,
        skipWaiting: true,

        // React Router fallback
        navigateFallback: '/gym-pilot/index.html',

        runtimeCaching: [
          {
            // Always try to get the latest React pages
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
            },
          },

          {
            // Fonts are safe to cache
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
            },
          },
        ],
      },
    }),
  ],
}))
