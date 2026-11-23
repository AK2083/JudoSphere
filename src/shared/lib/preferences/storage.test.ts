import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageCode } from '../i18n'
import { APP_PREFERENCES_STORAGE_KEY, DEFAULT_APP_PREFERENCES } from './defaults'
import {
  isPreferenceConfirmation,
  loadAppPreferences,
  mergeAppPreferences,
  saveAppPreferences
} from './storage'
import { ThemePreference } from './types'

describe('app preferences storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('merges valid fields onto defaults and ignores invalid ones', () => {
    expect(
      mergeAppPreferences({
        theme: ThemePreference.Dark,
        language: LanguageCode.DE,
        extra: true
      })
    ).toEqual({
      theme: ThemePreference.Dark,
      language: LanguageCode.DE,
      confirmations: DEFAULT_APP_PREFERENCES.confirmations
    })

    expect(mergeAppPreferences({ theme: 'neon', language: 'fr' })).toEqual(DEFAULT_APP_PREFERENCES)
    expect(mergeAppPreferences(null)).toEqual(DEFAULT_APP_PREFERENCES)
  })

  it('keeps valid disclaimer confirmation and defaults missing confirmation slots', () => {
    expect(
      mergeAppPreferences({
        theme: ThemePreference.Light,
        language: LanguageCode.EN,
        confirmations: {
          disclaimer: { version: '2026-01', acceptedAt: '2026-01-15T10:00:00.000Z' }
        }
      })
    ).toEqual({
      theme: ThemePreference.Light,
      language: LanguageCode.EN,
      confirmations: {
        disclaimer: { version: '2026-01', acceptedAt: '2026-01-15T10:00:00.000Z' }
      }
    })
  })

  it('accepts null confirmation fields and rejects non-object or invalid confirmations', () => {
    expect(isPreferenceConfirmation(null)).toBe(false)
    expect(isPreferenceConfirmation('nope')).toBe(false)
    expect(isPreferenceConfirmation({ version: 1, acceptedAt: null })).toBe(false)
    expect(isPreferenceConfirmation({ version: null, acceptedAt: 1 })).toBe(false)
    expect(isPreferenceConfirmation({ version: null, acceptedAt: null })).toBe(true)

    expect(
      mergeAppPreferences({
        confirmations: {
          disclaimer: { version: null, acceptedAt: null }
        }
      }).confirmations.disclaimer
    ).toEqual({ version: null, acceptedAt: null })

    expect(
      mergeAppPreferences({
        confirmations: { disclaimer: null }
      }).confirmations
    ).toEqual(DEFAULT_APP_PREFERENCES.confirmations)

    expect(
      mergeAppPreferences({
        confirmations: { disclaimer: { version: 1, acceptedAt: 'x' } }
      }).confirmations
    ).toEqual(DEFAULT_APP_PREFERENCES.confirmations)
  })

  it('seeds defaults on first load when storage is empty', () => {
    const prefs = loadAppPreferences()
    expect(prefs).toEqual(DEFAULT_APP_PREFERENCES)
    expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBe(JSON.stringify(prefs))
  })

  it('loads previously stored preferences', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: ThemePreference.Light, language: LanguageCode.DE })
    )

    expect(loadAppPreferences()).toEqual({
      theme: ThemePreference.Light,
      language: LanguageCode.DE,
      confirmations: DEFAULT_APP_PREFERENCES.confirmations
    })
  })

  it('falls back to defaults when stored JSON is corrupt', () => {
    localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, '{not-json')
    expect(loadAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES)
  })

  it('reports save failures without throwing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    })

    expect(saveAppPreferences(DEFAULT_APP_PREFERENCES)).toBe(false)
  })

  it('reports failure when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(saveAppPreferences(DEFAULT_APP_PREFERENCES)).toBe(false)
  })
})
