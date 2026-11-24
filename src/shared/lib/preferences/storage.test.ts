import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageCode } from '../i18n'
import { DEFAULT_APP_PREFERENCES } from './defaults'
import {
  isPreferenceConfirmation,
  isUiDensityPreference,
  mergeAppPreferences,
  saveAppPreferences
} from './storage'
import { ThemePreference, UiDensityPreference } from './types'

describe('app preferences storage helpers', () => {
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
        uiDensity: UiDensityPreference.Compact,
        extra: true
      })
    ).toEqual({
      theme: ThemePreference.Dark,
      language: LanguageCode.DE,
      uiDensity: UiDensityPreference.Compact,
      confirmations: DEFAULT_APP_PREFERENCES.confirmations
    })

    expect(mergeAppPreferences({ theme: 'neon', language: 'fr', uiDensity: 'dense' })).toEqual(
      DEFAULT_APP_PREFERENCES
    )
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
      uiDensity: DEFAULT_APP_PREFERENCES.uiDensity,
      confirmations: {
        disclaimer: { version: '2026-01', acceptedAt: '2026-01-15T10:00:00.000Z' }
      }
    })
  })

  it('recognizes supported uiDensity values', () => {
    expect(isUiDensityPreference(UiDensityPreference.Comfortable)).toBe(true)
    expect(isUiDensityPreference(UiDensityPreference.Compact)).toBe(true)
    expect(isUiDensityPreference('dense')).toBe(false)
    expect(isUiDensityPreference(null)).toBe(false)
  })

  it('fills only missing uiDensity when merging a theme/language bag', () => {
    expect(
      mergeAppPreferences({
        theme: ThemePreference.Dark,
        language: LanguageCode.EN
      })
    ).toEqual({
      theme: ThemePreference.Dark,
      language: LanguageCode.EN,
      uiDensity: DEFAULT_APP_PREFERENCES.uiDensity,
      confirmations: DEFAULT_APP_PREFERENCES.confirmations
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
      }).confirmations.disclaimer
    ).toEqual({ version: null, acceptedAt: 'x' })
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
