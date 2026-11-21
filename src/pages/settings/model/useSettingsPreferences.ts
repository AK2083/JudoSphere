import { type Component, ref } from 'vue'
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/vue/24/outline'

import { useTranslation } from '@shared/api'
import {
  applyThemePreference,
  AvailableLanguages,
  type LanguageCode,
  loadAppPreferences,
  saveAppPreferences,
  ThemePreference
} from '@shared/lib'

import translationKeys from '../i18n/keys'

/**
 *
 */
export type ThemeOption = {
  value: ThemePreference
  labelKey: string
  icon: Component
}

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
 * Settings screen bindings for theme and language preferences.
 * Loads the shared `localStorage` bag, reflects it in controls, and applies live UI updates.
 * @returns Reactive preferences, option lists, and setters used by `SettingsPage`
 */
export function useSettingsPreferences() {
  const { locale } = useTranslation()
  const stored = loadAppPreferences()

  const theme = ref<ThemePreference>(stored.theme)
  const language = ref<LanguageCode>(stored.language)

  applyThemePreference(theme.value)
  locale.value = language.value

  function persist(): void {
    saveAppPreferences({
      theme: theme.value,
      language: language.value
    })
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

  return {
    theme,
    language,
    themeOptions: THEME_OPTIONS,
    languageOptions: AvailableLanguages,
    setTheme,
    setLanguage
  }
}
