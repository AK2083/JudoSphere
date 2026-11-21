import type { LanguageCode } from '../i18n'

/**
 * Appearance preference stored in the shared preferences bag.
 */
export const ThemePreference = {
  Light: 'light',
  Dark: 'dark',
  System: 'system'
} as const

/**
 * Union of supported theme preference values.
 */
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference]

/**
 * Typed general preferences bag persisted in `localStorage`.
 */
export type AppPreferences = {
  theme: ThemePreference
  language: LanguageCode
}
