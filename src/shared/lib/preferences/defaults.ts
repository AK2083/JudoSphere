import { FallbackLanguage } from '../i18n'
import {
  type AppPreferenceConfirmations,
  type AppPreferences,
  type PreferenceConfirmation,
  ThemePreference,
  UiDensityPreference
} from './types'

/**
 * Default “not yet accepted” confirmation (no version, no timestamp).
 */
export const DEFAULT_PREFERENCE_CONFIRMATION: PreferenceConfirmation = {
  version: null,
  acceptedAt: null
}

/**
 * Default confirmation slots for first start / missing keys.
 */
export const DEFAULT_APP_PREFERENCE_CONFIRMATIONS: AppPreferenceConfirmations = {
  disclaimer: { ...DEFAULT_PREFERENCE_CONFIRMATION }
}

/**
 * Sensible first-start defaults for every known key in the shared preferences bag.
 */
export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: ThemePreference.System,
  language: FallbackLanguage,
  uiDensity: UiDensityPreference.Comfortable,
  confirmations: {
    disclaimer: { ...DEFAULT_PREFERENCE_CONFIRMATION }
  }
}

/**
 * Returns a fresh preferences bag cloned from defaults (safe to mutate / persist).
 * @returns Fully typed bag with every known key set to its first-start default
 */
export function createDefaultAppPreferences(): AppPreferences {
  return {
    theme: DEFAULT_APP_PREFERENCES.theme,
    language: DEFAULT_APP_PREFERENCES.language,
    uiDensity: DEFAULT_APP_PREFERENCES.uiDensity,
    confirmations: {
      disclaimer: { ...DEFAULT_APP_PREFERENCE_CONFIRMATIONS.disclaimer }
    }
  }
}

/**
 * Single `localStorage` key for the JSON preferences bag shared by host UI and LAN clients.
 * All general preferences (theme, language, uiDensity, confirmations, future options) live under this key.
 * Persistence for this milestone is browser `localStorage` only (no SQLite / cloud sync).
 * Keep in sync with the early theme boot script in `index.html` (same string literal).
 */
export const APP_PREFERENCES_STORAGE_KEY = 'judosphere.app.preferences'
