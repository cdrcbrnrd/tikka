import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tikka/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' lets the waiting worker take over on the next cold start: an auto update
      // would reload the page and throw away a session that is still running
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        name: 'Tikka',
        short_name: 'Tikka',
        description: 'Chronos de séance : intervalles, EMOM, AMRAP et chrono montant.',
        lang: 'fr',
        start_url: '/tikka/',
        scope: '/tikka/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#16231c',
        theme_color: '#16231c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
