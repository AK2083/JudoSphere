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
    expect(first.confirmations).not.toBe(DEFAULT_APP_PREFERENCES.confirmations)
    expect(first.confirmations.disclaimer).not.toBe(DEFAULT_APP_PREFERENCE_CONFIRMATIONS.disclaimer)

    first.confirmations.disclaimer.version = 'mutated'
    expect(second.confirmations.disclaimer.version).toBeNull()
    expect(DEFAULT_APP_PREFERENCES.confirmations.disclaimer.version).toBeNull()
  })
})
