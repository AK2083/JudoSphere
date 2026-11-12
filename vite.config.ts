import path from 'node:path'
import process from 'node:process'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import { DEV_SERVER_PORT } from './config/dev.js'

const dirname = import.meta.dirname
const host = process.env.TAURI_DEV_HOST

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [vue()],
  resolve: {
    alias: {
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
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  }
}))
