import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Оптимизация для PWA — разбиваем на чанки
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
          dnd: ['@hello-pangea/dnd'],
        },
      },
    },
    // Цель: страница < 1.5 сек (ТЗ QA)
    chunkSizeWarningLimit: 500,
  },

  // PWA — регистрируем service worker
  define: {
    __PWA_ENABLED__: true,
  },
});
