import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/gym-pilot/' : '/',

  plugins: [
    react(),
    tailwindcss(),

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
