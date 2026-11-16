/**
 * Supported language codes used by the application.
 */
export const LanguageCode = {
  DE: 'de',
  EN: 'en'
} as const

/**
 * Type representing all supported language codes.
 */
export type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode]

/**
 * Languages available in the UI (selectors, settings).
 */
export const AvailableLanguages: ReadonlyArray<{
  code: LanguageCode
  label: string
}> = [
  { code: LanguageCode.DE, label: 'Deutsch' },
  { code: LanguageCode.EN, label: 'English' }
]

/**
 * Default language when no preference is available.
 */
export const FallbackLanguage: LanguageCode = LanguageCode.EN
