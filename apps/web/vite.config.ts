import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/gym-pilot/' : '/',

  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'app-icon.svg',
      ],

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
        clientsClaim: true,
        skipWaiting: true,

        navigateFallback: '/gym-pilot/index.html',

        runtimeCaching: [
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