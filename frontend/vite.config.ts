import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// Trigger restart for react-is dependency
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5MB
      },
      manifest: {
        name: 'Ride Club',
        short_name: 'Ride Club',
        description: 'The Ultimate App for Motorcyclists',
        theme_color: '#ff4c00',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true
  },
  resolve: {
    alias: {
      lodash: 'lodash-es'
    }
  },
  optimizeDeps: {
    include: ['recharts', 'react-is', 'lodash']
  },
  build: {
    target: 'chrome80',
    sourcemap: true,
    minify: false,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
