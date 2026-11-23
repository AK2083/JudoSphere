import { LanguageCode } from '../i18n'
import {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCE_CONFIRMATIONS,
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
  const base: PreferenceConfirmation = { ...DEFAULT_PREFERENCE_CONFIRMATION }
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const record = raw as Record<string, unknown>
  if (record.version === null || typeof record.version === 'string') {
    base.version = record.version
  }
  if (record.acceptedAt === null || typeof record.acceptedAt === 'string') {
    base.acceptedAt = record.acceptedAt
  }

  return base
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
 * Merges a partial/unknown bag onto current defaults (upgrade-safe).
 * Keeps valid stored values; fills only missing or invalid known keys from defaults.
 * @param raw - Parsed JSON or partial object from storage
 * @returns Typed preferences with defaults for missing/invalid fields
 */
export function mergeAppPreferences(raw: unknown): AppPreferences {
  const base = createDefaultAppPreferences()
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
 * Reads preferences from browser `localStorage` only (no SQLite / cloud).
 * On first open (missing key), seeds defaults. On upgrade, merges stored values
 * onto current defaults and writes back when the stored JSON is not yet complete.
 * @returns Typed preferences bag (never empty/undefined known fields)
 */
export function loadAppPreferences(): AppPreferences {
  try {
    const raw = globalThis.localStorage?.getItem(APP_PREFERENCES_STORAGE_KEY)
    if (raw == null) {
      const seeded = createDefaultAppPreferences()
      saveAppPreferences(seeded)

      return seeded
    }

    const merged = mergeAppPreferences(JSON.parse(raw) as unknown)
    if (raw !== JSON.stringify(merged)) {
      saveAppPreferences(merged)
    }

    return merged
  } catch {
    return createDefaultAppPreferences()
  }
}

/**
 * Persists the preferences bag to browser `localStorage` only (no SQLite / cloud).
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
