import { loadAppPreferences } from './storage'
import { ThemePreference } from './types'

const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

let systemMedia: MediaQueryList | undefined
let systemMediaListener: (() => void) | undefined

/**
 * Resolves the current OS appearance to an explicit light or dark scheme.
 * Falls back to `light` when `matchMedia` is unavailable.
 * @returns Resolved scheme for the document root
 */
export function resolveSystemColorScheme(): 'light' | 'dark' {
  if (typeof globalThis.matchMedia !== 'function') {
    return 'light'
  }

  return globalThis.matchMedia(PREFERS_DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * Stops listening for OS appearance changes (used when leaving `system` theme).
 */
export function stopSystemThemeWatch(): void {
  if (systemMedia && systemMediaListener) {
    systemMedia.removeEventListener('change', systemMediaListener)
  }
  systemMedia = undefined
  systemMediaListener = undefined
}

function syncSystemThemeToDocument(): void {
  const root = globalThis.document?.documentElement
  if (!root) {
    return
  }

  root.setAttribute('data-color-scheme', resolveSystemColorScheme())
}

/**
 * Starts (or restarts) watching OS appearance and syncing it to the document root.
 * No-ops when `matchMedia` is unavailable; still applies the resolved fallback once.
 */
function startSystemThemeWatch(): void {
  stopSystemThemeWatch()
  syncSystemThemeToDocument()

  if (typeof globalThis.matchMedia !== 'function') {
    return
  }

  systemMedia = globalThis.matchMedia(PREFERS_DARK_QUERY)
  systemMediaListener = () => {
    syncSystemThemeToDocument()
  }
  systemMedia.addEventListener('change', systemMediaListener)
}

/**
 * Applies a theme preference to the document root (`data-color-scheme`).
 * `system` mirrors the current OS appearance and keeps tracking changes;
 * `light` / `dark` lock the scheme and stop OS tracking.
 * @param theme - Stored theme preference
 */
export function applyThemePreference(theme: ThemePreference): void {
  const root = globalThis.document?.documentElement
  if (!root) {
    return
  }

  if (theme === ThemePreference.System) {
    startSystemThemeWatch()

    return
  }

  stopSystemThemeWatch()
  root.setAttribute('data-color-scheme', theme)
}

/**
 * Loads the shared `localStorage` preferences bag and applies its theme on startup.
 * Safe to call before Vue mounts; uses each device’s own storage (host UI and LAN clients).
 * @returns The theme that was applied (after seed/merge)
 */
export function applyPersistedThemeOnStartup(): ThemePreference {
  const { theme } = loadAppPreferences()
  applyThemePreference(theme)

  return theme
}
