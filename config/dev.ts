import defaults from './dev.json' with { type: 'json' }

/**
 * Port and host defaults live in `config/dev.json`.
 * Override them via environment variables.
 *
 * | Variable | Purpose | Default |
 * | --- | --- | --- |
 * | `VITE_DEV_SERVER_HOST` / `DEV_HOST` | Host for Vite and tooling | `127.0.0.1` |
 * | `VITE_DEV_SERVER_PORT` | Vite/Tauri frontend port | `1420` |
 * | `E2E_SERVER_PORT` | Playwright preview server port | `4173` |
 * | `STORYBOOK_PORT` | Storybook UI catalog | `6006` |
 * | `VITEST_STORYBOOK_BROWSER_PORT` | Vitest browser runner for Storybook | `42123` |
 */

/**
 * Reads a numeric port from the environment, falling back when missing or invalid.
 * @param envKey - Environment variable name.
 * @param fallback - Default port.
 * @returns Resolved port number.
 */
function readPort(envKey: string, fallback: number) {
  const raw = process.env[envKey]

  if (raw === undefined) {
    return fallback
  }

  const parsed = Number(raw)

  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Host used by Vite, Vitest, and Storybook tooling.
 */
export const DEV_HOST = process.env.VITE_DEV_SERVER_HOST ?? process.env.DEV_HOST ?? defaults.host

/**
 * Vite/Tauri frontend development port.
 */
export const DEV_SERVER_PORT = readPort('VITE_DEV_SERVER_PORT', defaults.devServerPort)

/**
 * Playwright e2e preview server port.
 */
export const E2E_SERVER_PORT = readPort('E2E_SERVER_PORT', defaults.e2eServerPort)

/**
 * Storybook development server port.
 */
export const STORYBOOK_PORT = readPort('STORYBOOK_PORT', defaults.storybookPort)

/**
 * Port for the Vitest browser runner used by Storybook tests.
 */
export const VITEST_STORYBOOK_BROWSER_PORT = readPort(
  'VITEST_STORYBOOK_BROWSER_PORT',
  defaults.vitestStorybookBrowserPort
)

/**
 * Builds a local HTTP URL for the given port.
 * @param port - Port number.
 * @param host - Host name.
 * @returns Absolute local URL.
 */
export function localUrl(port: number, host: string = DEV_HOST) {
  return `http://${host}:${port}`
}

/**
 * Base URL for Playwright e2e tests.
 */
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? localUrl(E2E_SERVER_PORT)

/**
 * Default Vite/Tauri development server URL.
 */
export const DEV_SERVER_URL = localUrl(DEV_SERVER_PORT)

/**
 * Resolves the active development server URL, allowing an explicit override.
 * @returns Development server URL.
 */
export function resolveDevServerUrl() {
  return process.env.VITE_DEV_SERVER_URL ?? DEV_SERVER_URL
}
