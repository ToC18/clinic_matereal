import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // 1. Импортируем path

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // 2. Добавляем новую секцию resolve
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})