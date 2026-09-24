import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/GastroRatio/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GastroRatio — Engenharia Culinária & Despensa Inteligente',
        short_name: 'GastroRatio',
        description: 'Redimensionador em gramas exatos, Baker Ratio e despensa sem atrito.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait'
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  }
});
