import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// @ts-expect-error type error without @types/node package
import process from "node:process";
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(() => ({
  plugins: [vue()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || "0.0.0.0",
    allowedHosts: true as const,
  },
}));