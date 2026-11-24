import { type Component, ref } from 'vue'
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

import { useTranslation } from '@shared/api'
import {
  applyThemePreference,
  AvailableLanguages,
  type LanguageCode,
  loadAppPreferences,
  saveAppPreferences,
  ThemePreference,
  UiDensityPreference
} from '@shared/lib'

import translationKeys from '../i18n/keys'

/**
 * Theme control option with i18n label key and Heroicon component.
 */
export type ThemeOption = {
  value: ThemePreference
  labelKey: string
  icon: Component
}

/**
 * Visible persist feedback after a settings write attempt.
 */
export type SettingsPersistFeedback = 'idle' | 'success' | 'error'

const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    value: ThemePreference.Light,
    labelKey: translationKeys.themeLight,
    icon: SunIcon
  },
  {
    value: ThemePreference.Dark,
    labelKey: translationKeys.themeDark,
    icon: MoonIcon
  },
  {
    value: ThemePreference.System,
    labelKey: translationKeys.themeSystem,
    icon: ComputerDesktopIcon
  }
] as const

/**
 * UI density control options (same shared bag as theme/language; settings UI optional).
 */
export const UI_DENSITY_OPTIONS: readonly UiDensityPreference[] = [
  UiDensityPreference.Comfortable,
  UiDensityPreference.Compact
] as const

/**
 * Settings screen bindings for theme, language, and extensible preferences (e.g. uiDensity).
 * Loads the shared `localStorage` bag, reflects it in controls, applies live UI updates,
 * and exposes success/failure feedback for persist attempts.
 * @returns Reactive preferences, option lists, persist feedback, and setters used by `SettingsPage`
 */
export function useSettingsPreferences() {
  const { locale } = useTranslation()
  const stored = loadAppPreferences()

  const theme = ref<ThemePreference>(stored.theme)
  const language = ref<LanguageCode>(stored.language)
  const uiDensity = ref<UiDensityPreference>(stored.uiDensity)
  const persistFeedback = ref<SettingsPersistFeedback>('idle')

  applyThemePreference(theme.value)
  locale.value = language.value

  function persist(): boolean {
    const saved = saveAppPreferences({
      ...loadAppPreferences(),
      theme: theme.value,
      language: language.value,
      uiDensity: uiDensity.value
    })
    persistFeedback.value = saved ? 'success' : 'error'

    return saved
  }

  function setTheme(next: ThemePreference): void {
    theme.value = next
    applyThemePreference(next)
    persist()
  }

  function setLanguage(next: LanguageCode): void {
    language.value = next
    locale.value = next
    persist()
  }

  function setUiDensity(next: UiDensityPreference): void {
    uiDensity.value = next
    persist()
  }

  return {
    theme,
    language,
    uiDensity,
    persistFeedback,
    themeOptions: THEME_OPTIONS,
    languageOptions: AvailableLanguages,
    uiDensityOptions: UI_DENSITY_OPTIONS,
    setTheme,
    setLanguage,
    setUiDensity
  }
}
