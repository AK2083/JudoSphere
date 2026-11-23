export { applyThemePreference } from './applyTheme'
export {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCE_CONFIRMATIONS,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_PREFERENCE_CONFIRMATION
} from './defaults'
export {
  isLanguageCode,
  isPreferenceConfirmation,
  isThemePreference,
  loadAppPreferences,
  mergeAppPreferences,
  saveAppPreferences
} from './storage'
export {
  type AppPreferenceConfirmations,
  type AppPreferences,
  type PreferenceConfirmation,
  ThemePreference
} from './types'
