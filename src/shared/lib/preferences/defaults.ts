import { FallbackLanguage } from '../i18n'
import { type AppPreferences, ThemePreference } from './types'

/**
 * Sensible first-start defaults for the shared preferences bag.
 */
export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  theme: ThemePreference.System,
  language: FallbackLanguage
}

/**
 * `localStorage` key for the JSON preferences bag.
 */
export const APP_PREFERENCES_STORAGE_KEY = 'judosphere.app.preferences'
