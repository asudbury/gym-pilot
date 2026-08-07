import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/gym-pilot/' : '/',

  build: {
    rollupOptions: {
      output: {
        // Vite hashes already provide cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name]-[hash].css'
          }

          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      devOptions: {
        enabled: false,
      },

      includeAssets: ['favicon.svg', 'app-icon-192.png', 'app-icon-512.png'],

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
            src: '/gym-pilot/app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/gym-pilot/app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

        cleanupOutdatedCaches: true,

        navigateFallback: '/gym-pilot/index.html',

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',

            handler: 'NetworkFirst',

            options: {
              cacheName: 'pages',
            },
          },

          {
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
