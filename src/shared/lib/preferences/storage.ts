import { LanguageCode } from '../i18n'
import { APP_PREFERENCES_STORAGE_KEY, DEFAULT_APP_PREFERENCES } from './defaults'
import { type AppPreferences, ThemePreference } from './types'

const THEME_VALUES = new Set<string>(Object.values(ThemePreference))
const LANGUAGE_VALUES = new Set<string>(Object.values(LanguageCode))

/**
 * Returns whether a value is a supported theme preference.
 * @param value - Unknown candidate from storage
 * @returns `true` when `value` is a known theme preference
 */
export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_VALUES.has(value)
}

/**
 * Returns whether a value is a supported language code.
 * @param value - Unknown candidate from storage
 * @returns `true` when `value` is a known language code
 */
export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && LANGUAGE_VALUES.has(value)
}

/**
 * Merges a partial/unknown bag onto defaults, keeping only valid known fields.
 * @param raw - Parsed JSON or partial object from storage
 * @returns Typed preferences with defaults for missing/invalid fields
 */
export function mergeAppPreferences(raw: unknown): AppPreferences {
  const base: AppPreferences = { ...DEFAULT_APP_PREFERENCES }
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const record = raw as Record<string, unknown>
  if (isThemePreference(record.theme)) {
    base.theme = record.theme
  }
  if (isLanguageCode(record.language)) {
    base.language = record.language
  }

  return base
}

/**
 * Reads preferences from `localStorage`, seeding defaults when missing/corrupt.
 * @returns Typed preferences bag (never empty/undefined fields)
 */
export function loadAppPreferences(): AppPreferences {
  try {
    const raw = globalThis.localStorage?.getItem(APP_PREFERENCES_STORAGE_KEY)
    if (raw == null) {
      const seeded = { ...DEFAULT_APP_PREFERENCES }
      saveAppPreferences(seeded)

      return seeded
    }

    return mergeAppPreferences(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_APP_PREFERENCES }
  }
}

/**
 * Persists the preferences bag to `localStorage`.
 * @param preferences - Full typed bag to store
 * @returns Whether the write succeeded
 */
export function saveAppPreferences(preferences: AppPreferences): boolean {
  try {
    const storage = globalThis.localStorage
    if (!storage) {
      return false
    }

    storage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))

    return true
  } catch {
    return false
  }
}
