import packageJson from '../../../package.json'

/**
 * Human-readable codename shown under the semantic version in the app shell notch.
 * Bump this when releasing a named milestone; keep `package.json` / Tauri / Cargo versions in sync
 * (see CONTRIBUTING “App version & version name”).
 */
export const APP_VERSION_NAME = 'White Belt'

/**
 * Semantic version for the shell notch and about/chrome surfaces.
 * Sourced from root `package.json` so the UI does not hard-code a second version string.
 */
export const APP_VERSION = packageJson.version

/**
 * Single app-owned version identity for shell chrome (notch, about, diagnostics).
 */
export const appVersion = {
  /** SemVer from `package.json` (keep Tauri `tauri.conf.json` + `Cargo.toml` aligned). */
  version: APP_VERSION,
  /** Codename paired with the SemVer for the brand notch. */
  versionName: APP_VERSION_NAME
} as const

/**
 * Shape of the shared app version identity used by shell chrome.
 */
export type AppVersion = typeof appVersion
