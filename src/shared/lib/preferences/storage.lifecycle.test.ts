import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageCode } from '../i18n'
import { APP_PREFERENCES_STORAGE_KEY, DEFAULT_APP_PREFERENCES } from './defaults'
import { loadAppPreferences, mergeAppPreferences } from './storage'
import { ThemePreference } from './types'

describe('preferences seed, merge-on-upgrade, and corrupt recovery', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('seed on first start', () => {
    it('writes full defaults when localStorage has no entry', () => {
      expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBeNull()

      const prefs = loadAppPreferences()

      expect(prefs).toEqual(DEFAULT_APP_PREFERENCES)
      expect(prefs.theme).toBeDefined()
      expect(prefs.language).toBeDefined()
      expect(prefs.confirmations.disclaimer).toEqual({ version: null, acceptedAt: null })
      expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBe(JSON.stringify(prefs))
    })

    it('returns a full typed bag when localStorage is unavailable', () => {
      vi.stubGlobal('localStorage', undefined)

      expect(loadAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES)
    })

    it('keeps seeded values on a subsequent load', () => {
      const first = loadAppPreferences()
      const second = loadAppPreferences()

      expect(second).toEqual(first)
      expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBe(JSON.stringify(first))
    })
  })

  describe('merge on upgrade', () => {
    it('keeps existing values and defaults only missing keys when loading a partial bag', () => {
      localStorage.setItem(
        APP_PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          theme: ThemePreference.Dark,
          language: LanguageCode.EN
        })
      )

      const prefs = loadAppPreferences()

      expect(prefs).toEqual({
        theme: ThemePreference.Dark,
        language: LanguageCode.EN,
        confirmations: DEFAULT_APP_PREFERENCES.confirmations
      })
      expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toEqual(prefs)
    })

    it('merges a partial object onto defaults without wiping valid fields', () => {
      expect(
        mergeAppPreferences({
          theme: ThemePreference.Light,
          confirmations: {
            disclaimer: { version: '2026-02' }
          }
        })
      ).toEqual({
        theme: ThemePreference.Light,
        language: DEFAULT_APP_PREFERENCES.language,
        confirmations: {
          disclaimer: { version: '2026-02', acceptedAt: null }
        }
      })
    })

    it('does not rewrite storage when the bag is already complete', () => {
      const complete = mergeAppPreferences({
        theme: ThemePreference.Dark,
        language: LanguageCode.EN,
        confirmations: {
          disclaimer: { version: 'keep', acceptedAt: '2026-01-01T00:00:00.000Z' }
        }
      })
      localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(complete))

      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      expect(loadAppPreferences()).toEqual(complete)
      expect(setItem).not.toHaveBeenCalled()
      setItem.mockRestore()
    })
  })

  describe('invalid and partially corrupted JSON', () => {
    it('falls back to defaults for invalid JSON and rewrites storage', () => {
      localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, '{not-json')

      expect(() => loadAppPreferences()).not.toThrow()
      expect(loadAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES)
      expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBe(
        JSON.stringify(DEFAULT_APP_PREFERENCES)
      )
    })

    it('keeps valid fields from a partially corrupt bag and rewrites a safe bag', () => {
      localStorage.setItem(
        APP_PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          theme: ThemePreference.Dark,
          language: 'not-a-language',
          confirmations: { disclaimer: { version: 99, acceptedAt: 'ok' } }
        })
      )

      const prefs = loadAppPreferences()

      expect(prefs).toEqual({
        theme: ThemePreference.Dark,
        language: DEFAULT_APP_PREFERENCES.language,
        confirmations: {
          disclaimer: { version: null, acceptedAt: 'ok' }
        }
      })
      expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toEqual(prefs)
    })

    it('recovers non-object JSON payloads without throwing', () => {
      for (const payload of ['null', '42', '"oops"', '[]']) {
        localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, payload)
        expect(() => loadAppPreferences()).not.toThrow()
        expect(loadAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES)
        expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBe(
          JSON.stringify(DEFAULT_APP_PREFERENCES)
        )
      }
    })

    it('returns defaults without throwing when localStorage getItem fails', () => {
      vi.stubGlobal('localStorage', {
        getItem: () => {
          throw new Error('denied')
        },
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
      })

      expect(() => loadAppPreferences()).not.toThrow()
      expect(loadAppPreferences()).toEqual(DEFAULT_APP_PREFERENCES)
    })
  })
})
