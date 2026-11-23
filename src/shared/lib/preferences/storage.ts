import { LanguageCode } from '../i18n'
import {
  APP_PREFERENCES_STORAGE_KEY,
  DEFAULT_APP_PREFERENCE_CONFIRMATIONS,
  DEFAULT_APP_PREFERENCES,
  DEFAULT_PREFERENCE_CONFIRMATION
} from './defaults'
import {
  type AppPreferenceConfirmations,
  type AppPreferences,
  type PreferenceConfirmation,
  ThemePreference
} from './types'

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
 * Returns whether a value is a usable preference confirmation record.
 * @param value - Unknown candidate from storage
 * @returns `true` when `version` and `acceptedAt` are each string or null
 */
export function isPreferenceConfirmation(value: unknown): value is PreferenceConfirmation {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  const versionOk = record.version === null || typeof record.version === 'string'
  const acceptedAtOk = record.acceptedAt === null || typeof record.acceptedAt === 'string'

  return versionOk && acceptedAtOk
}

function mergePreferenceConfirmation(raw: unknown): PreferenceConfirmation {
  if (!isPreferenceConfirmation(raw)) {
    return { ...DEFAULT_PREFERENCE_CONFIRMATION }
  }

  return {
    version: raw.version,
    acceptedAt: raw.acceptedAt
  }
}

function mergeAppPreferenceConfirmations(raw: unknown): AppPreferenceConfirmations {
  const base: AppPreferenceConfirmations = {
    disclaimer: { ...DEFAULT_APP_PREFERENCE_CONFIRMATIONS.disclaimer }
  }
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const record = raw as Record<string, unknown>
  base.disclaimer = mergePreferenceConfirmation(record.disclaimer)

  return base
}

/**
 * Merges a partial/unknown bag onto defaults, keeping only valid known fields.
 * @param raw - Parsed JSON or partial object from storage
 * @returns Typed preferences with defaults for missing/invalid fields
 */
export function mergeAppPreferences(raw: unknown): AppPreferences {
  const base: AppPreferences = {
    ...DEFAULT_APP_PREFERENCES,
    confirmations: mergeAppPreferenceConfirmations(undefined)
  }
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
  base.confirmations = mergeAppPreferenceConfirmations(record.confirmations)

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
