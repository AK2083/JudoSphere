import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const host = process.env.TAURI_DEV_HOST

export default defineConfig(() => ({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || '0.0.0.0',
    allowedHosts: true as const
  }
}))
