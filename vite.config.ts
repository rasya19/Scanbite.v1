import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'inline',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          cleanupOutdatedCaches: true,
        },
        manifest: {
          name: 'ScanBite Self-Service QR Cafe',
          short_name: 'ScanBite',
          description: 'Aplikasi manajemen pemesanan mandiri berbasis QR Code dengan Split Bill dan Jukebox.',
          theme_color: '#8C6239',
          background_color: '#FDFBF7',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '.',
          scope: '/',
          icons: [
            {
              src: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=192&h=192&q=80',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=512&h=512&q=80',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
