import packageJson from '../../../package.json'

/** Fallback when `VITE_APP_VERSION_NAME` is unset or blank (no baked-in designation). */
export const DEFAULT_APP_VERSION_NAME = ''

/**
 * Resolves the notch version designation.
 * CI/release builds pass a per-release name via `VITE_APP_VERSION_NAME`;
 * otherwise the designation is an empty string.
 *
 * @param override - Value from `import.meta.env.VITE_APP_VERSION_NAME`
 * @param fallback - Used when override is missing or blank
 * @returns Trimmed override, or `fallback` when override is missing/blank
 */
export function resolveAppVersionName(
  override: string | undefined,
  fallback: string = DEFAULT_APP_VERSION_NAME
): string {
  const trimmed = override?.trim()
  return trimmed ? trimmed : fallback
}

/**
 * Human-readable designation shown under the semantic version in the app shell notch.
 * Prefer `VITE_APP_VERSION_NAME` when set (release builds); otherwise empty.
 * Keep `package.json` / Tauri / Cargo SemVer in sync (see CONTRIBUTING).
 */
export const APP_VERSION_NAME = resolveAppVersionName(import.meta.env.VITE_APP_VERSION_NAME)

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
  /** Designation paired with the SemVer for the brand notch (empty unless env/release sets it). */
  versionName: APP_VERSION_NAME
} as const

/**
 * Shape of the shared app version identity used by shell chrome.
 */
export type AppVersion = typeof appVersion
