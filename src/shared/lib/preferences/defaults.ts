import { FallbackLanguage } from '../i18n'
import {
  type AppPreferenceConfirmations,
  type AppPreferences,
  type PreferenceConfirmation,
  ThemePreference
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
  confirmations: {
    disclaimer: { ...DEFAULT_PREFERENCE_CONFIRMATION }
  }
}

/**
 * Single `localStorage` key for the JSON preferences bag shared by host UI and LAN clients.
 * All general preferences (theme, language, confirmations, future options) live under this key.
 */
export const APP_PREFERENCES_STORAGE_KEY = 'judosphere.app.preferences'
