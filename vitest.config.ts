import path from 'node:path'
import process from 'node:process'

import tailwindcss from '@tailwindcss/vite'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

import { DEV_HOST, VITEST_STORYBOOK_BROWSER_PORT } from './config/dev.js'

const dirname = import.meta.dirname
const includeStorybookProject = process.env.VITEST_STORYBOOK === 'true'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
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
  test: {
    api: {
      host: DEV_HOST
    },
    coverage: {
      provider: 'v8' as const,
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      clean: true,
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.stories.ts',
        '**/node_modules/**',
        '**/dist/**',
        'src/app/**',
        'src/pages/**',
        'src/features/greet/**',
        'src/shared/api/tauri.ts',
        'src/shared/api/opener.ts',
        'src/shared/lib/**',
        'src/main.ts',
        'src/vite-env.d.ts'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'happy-dom',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
        }
      },
      ...(includeStorybookProject
        ? [
            {
              extends: true as const,
              plugins: [
                storybookTest({
                  configDir: path.join(dirname, '.storybook')
                })
              ],
              test: {
                name: 'storybook',
                // Vitest 5: browser API host/port live on `test.api` (DojoSphere used Vitest 4 `browser.api`)
                api: {
                  host: DEV_HOST,
                  port: VITEST_STORYBOOK_BROWSER_PORT
                },
                browser: {
                  enabled: true,
                  headless: true,
                  provider: playwright({}),
                  instances: [
                    {
                      browser: 'chromium' as const
                    }
                  ]
                }
              }
            }
          ]
        : [])
    ]
  }
})
