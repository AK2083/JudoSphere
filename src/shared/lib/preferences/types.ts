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
 * Chrome density preference for day-of UI compactness.
 * Harmless extra general option proving the extensible preferences bag.
 */
export const UiDensityPreference = {
  Comfortable: 'comfortable',
  Compact: 'compact'
} as const

/**
 * Union of supported UI density preference values.
 */
export type UiDensityPreference = (typeof UiDensityPreference)[keyof typeof UiDensityPreference]

/**
 * Versioned one-off confirmation stored on this device (disclaimer now; more later).
 * `version` is the accepted content version; `acceptedAt` is an ISO-8601 timestamp.
 * Both are `null` until the user accepts the current notice.
 */
export type PreferenceConfirmation = {
  version: string | null
  acceptedAt: string | null
}

/**
 * Known confirmation slots in the preferences bag.
 * Add new one-off notices as named keys here (same shape as `disclaimer`).
 */
export type AppPreferenceConfirmations = {
  disclaimer: PreferenceConfirmation
}

/**
 * Typed general preferences bag persisted in `localStorage`.
 *
 * Extend by adding a new top-level key with a matching default in
 * `DEFAULT_APP_PREFERENCES` (and merge/validation in storage). Nested
 * `confirmations` holds versioned acceptances; other day-of options belong
 * as sibling keys on this type (e.g. `uiDensity`).
 * Step-by-step: see `README.md` in this folder.
 */
export type AppPreferences = {
  theme: ThemePreference
  language: LanguageCode
  uiDensity: UiDensityPreference
  confirmations: AppPreferenceConfirmations
}
