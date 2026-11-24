import { describe, expect, it } from 'vitest'

import {
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCE_CONFIRMATIONS,
  DEFAULT_APP_PREFERENCES
} from './defaults'

describe('createDefaultAppPreferences', () => {
  it('returns a deep-enough clone of defaults that can be mutated safely', () => {
    const first = createDefaultAppPreferences()
    const second = createDefaultAppPreferences()

    expect(first).toEqual(DEFAULT_APP_PREFERENCES)
    expect(first).not.toBe(DEFAULT_APP_PREFERENCES)
    expect(first.uiDensity).toBe(DEFAULT_APP_PREFERENCES.uiDensity)
    expect(first.confirmations).not.toBe(DEFAULT_APP_PREFERENCES.confirmations)
    expect(first.confirmations.disclaimer).not.toBe(DEFAULT_APP_PREFERENCE_CONFIRMATIONS.disclaimer)

    first.confirmations.disclaimer.version = 'mutated'
    expect(second.confirmations.disclaimer.version).toBeNull()
    expect(DEFAULT_APP_PREFERENCES.confirmations.disclaimer.version).toBeNull()
  })

  it('seeds the concrete uiDensity extra default beyond theme and language', () => {
    const prefs = createDefaultAppPreferences()

    expect(prefs.theme).toBe(DEFAULT_APP_PREFERENCES.theme)
    expect(prefs.language).toBe(DEFAULT_APP_PREFERENCES.language)
    expect(prefs.uiDensity).toBe('comfortable')
  })
})
