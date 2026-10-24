import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Talking Back',
        short_name: 'Talking Back',
        description: 'Recognize the thought, answer it with Scripture. Inspired by Evagrius of Pontus.',
        theme_color: '#0a1124',
        background_color: '#0a1124',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,json,woff2}'],
        // The verse recordings (about 23 MB) are kept as each is first played, not all up front.
        // The player asks for byte ranges, so they are cut from the whole file that src/lib/speak.ts fetches.
        runtimeCaching: [
          {
            urlPattern: /\/audio\/[0-9a-f]+\.m4a$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio', rangeRequests: true, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
});
