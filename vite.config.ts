import path from 'node:path'
import process from 'node:process'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { DEV_HOST, DEV_SERVER_PORT } from './config/dev.js'

const dirname = import.meta.dirname
const host = process.env.TAURI_DEV_HOST || DEV_HOST

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [vue(), tailwindcss()],
  // Expose LOG_* to the client (log level SSOT via env; see config/logging.json).
  envPrefix: ['VITE_', 'LOG_'],
  resolve: {
    alias: {
      '@config': path.resolve(dirname, 'config'),
      '@shared': path.resolve(dirname, 'src/shared'),
      '@app': path.resolve(dirname, 'src/app'),
      '@features': path.resolve(dirname, 'src/features'),
      '@widgets': path.resolve(dirname, 'src/widgets'),
      '@pages': path.resolve(dirname, 'src/pages'),
      '@entities': path.resolve(dirname, 'src/entities')
    }
  },
  clearScreen: false,
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
    // Bind IPv4 explicitly so Safari/Chrome and Tauri all hit the same address
    // (`localhost` alone can resolve to ::1 while clients use 127.0.0.1).
    host,
    hmr: process.env.TAURI_DEV_HOST
      ? {
          protocol: 'ws',
          host: process.env.TAURI_DEV_HOST,
          port: 1421
        }
      : {
          host: DEV_HOST
        },
    watch: {
      ignored: ['**/src-tauri/**']
    }
  }
}))
