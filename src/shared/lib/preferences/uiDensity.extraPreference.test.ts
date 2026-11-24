import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageCode } from '../i18n'
import {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCES
} from './defaults'
import { loadAppPreferences, mergeAppPreferences, saveAppPreferences } from './storage'
import { ThemePreference, UiDensityPreference } from './types'

/**
 * Focused coverage for the concrete extra UI default (`uiDensity`) via the shared bag.
 */
describe('extra preference uiDensity via shared bag', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('reads the seeded uiDensity default from the shared preferences bag', () => {
    expect(createDefaultAppPreferences().uiDensity).toBe(UiDensityPreference.Comfortable)

    const prefs = loadAppPreferences()

    expect(prefs.uiDensity).toBe(DEFAULT_APP_PREFERENCES.uiDensity)
    expect(prefs.uiDensity).toBe(UiDensityPreference.Comfortable)
    expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toMatchObject({
      uiDensity: UiDensityPreference.Comfortable
    })
  })

  it('persists a written uiDensity value and reads it back from the bag', () => {
    const written = {
      ...createDefaultAppPreferences(),
      uiDensity: UiDensityPreference.Compact
    }

    expect(saveAppPreferences(written)).toBe(true)

    const readBack = loadAppPreferences()

    expect(readBack.uiDensity).toBe(UiDensityPreference.Compact)
    expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toMatchObject({
      uiDensity: UiDensityPreference.Compact
    })
  })

  it('keeps existing theme/language when merging the uiDensity key into a legacy bag', () => {
    const legacy = {
      theme: ThemePreference.Dark,
      language: LanguageCode.DE
    }

    expect(mergeAppPreferences(legacy)).toEqual({
      theme: ThemePreference.Dark,
      language: LanguageCode.DE,
      uiDensity: DEFAULT_APP_PREFERENCES.uiDensity,
      confirmations: DEFAULT_APP_PREFERENCES.confirmations
    })

    localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(legacy))
    const loaded = loadAppPreferences()

    expect(loaded.theme).toBe(ThemePreference.Dark)
    expect(loaded.language).toBe(LanguageCode.DE)
    expect(loaded.uiDensity).toBe(UiDensityPreference.Comfortable)
  })
})
