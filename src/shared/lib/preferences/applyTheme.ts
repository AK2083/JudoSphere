import { loadAppPreferences } from './storage'
import { ThemePreference } from './types'

/**
 * Applies a theme preference to the document root (`data-color-scheme`).
 * `system` clears the attribute so OS preference media queries apply.
 * @param theme - Stored theme preference
 */
export function applyThemePreference(theme: ThemePreference): void {
  const root = globalThis.document?.documentElement
  if (!root) {
    return
  }

  if (theme === ThemePreference.System) {
    root.removeAttribute('data-color-scheme')

    return
  }

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
