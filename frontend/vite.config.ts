import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'RPG Virtual Table',
        short_name: 'RPG Table',
        description: 'Mesa Virtual Completa para RPG com Realtime',
        theme_color: '#1f2937',
        background_color: '#1f2937',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (
            id.includes('react-player')
            || id.includes('hls.js')
            || id.includes('dashjs')
            || id.includes('@mux')
            || id.includes('youtube-video-element')
            || id.includes('vimeo-video-element')
            || id.includes('spotify-audio-element')
            || id.includes('twitch-video-element')
          ) {
            return 'vendor-media'
          }

          if (id.includes('konva') || id.includes('react-konva') || id.includes('use-image')) {
            return 'vendor-canvas'
          }

          if (id.includes('framer-motion')) {
            return 'vendor-motion'
          }

          return undefined
        }
      }
    }
  },
  resolve: {
    alias: {
      '@shared': '../shared'
    }
  }
})