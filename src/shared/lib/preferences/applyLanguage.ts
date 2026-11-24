import type { LanguageCode } from '../i18n'
import { loadAppPreferences } from './storage'

/**
 * Sets the document root `lang` attribute to the given language code when a document exists.
 * @param language - Persisted or fallback language code
 */
export function applyDocumentLanguage(language: LanguageCode): void {
  const root = globalThis.document?.documentElement
  if (!root) {
    return
  }

  root.setAttribute('lang', language)
}

/**
 * Loads the shared `localStorage` preferences bag and applies its language on startup.
 * Pass a setter for the app vue-i18n locale; invalid/missing values are already
 * normalized by `loadAppPreferences` (safe fallback, no throw).
 * Uses each device’s own storage (host UI and LAN clients).
 * @param applyLocale - Callback that sets the app i18n locale
 * @returns The language that was applied (after seed/merge)
 */
export function applyPersistedLanguageOnStartup(
  applyLocale: (language: LanguageCode) => void
): LanguageCode {
  const { language } = loadAppPreferences()
  applyLocale(language)
  applyDocumentLanguage(language)

  return language
}
