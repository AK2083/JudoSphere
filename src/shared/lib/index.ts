export {
  AvailableLanguages,
  FallbackLanguage,
  LanguageCode,
  sharedDe,
  sharedEn,
  sharedTranslationKeys
} from './i18n'
export {
  APP_PREFERENCES_STORAGE_KEY,
  applyDocumentLanguage,
  applyPersistedLanguageOnStartup,
  applyPersistedThemeOnStartup,
  applyThemePreference,
  type AppPreferenceConfirmations,
  type AppPreferences,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCE_CONFIRMATIONS,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_PREFERENCE_CONFIRMATION,
  isLanguageCode,
  isPreferenceConfirmation,
  isThemePreference,
  isUiDensityPreference,
  loadAppPreferences,
  mergeAppPreferences,
  type PreferenceConfirmation,
  resolveSystemColorScheme,
  saveAppPreferences,
  stopSystemThemeWatch,
  ThemePreference,
  UiDensityPreference
} from './preferences'
