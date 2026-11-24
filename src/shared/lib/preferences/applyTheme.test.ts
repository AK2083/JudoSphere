import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyPersistedThemeOnStartup, applyThemePreference } from './applyTheme'
import {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCES
} from './defaults'
import { ThemePreference } from './types'

describe('applyThemePreference', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement?.removeAttribute('data-color-scheme')
  })

  it('sets light and dark data-color-scheme attributes', () => {
    applyThemePreference(ThemePreference.Light)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')

    applyThemePreference(ThemePreference.Dark)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
  })

  it('removes data-color-scheme for system preference', () => {
    document.documentElement.setAttribute('data-color-scheme', 'dark')
    applyThemePreference(ThemePreference.System)
    expect(document.documentElement.hasAttribute('data-color-scheme')).toBe(false)
  })

  it('no-ops when document root is unavailable', () => {
    vi.stubGlobal('document', undefined)

    expect(() => applyThemePreference(ThemePreference.Light)).not.toThrow()
  })
})

describe('applyPersistedThemeOnStartup', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('applies a stored light theme from the preferences bag', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), theme: ThemePreference.Light })
    )

    expect(applyPersistedThemeOnStartup()).toBe(ThemePreference.Light)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
  })

  it('applies a stored dark theme from the preferences bag', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), theme: ThemePreference.Dark })
    )

    expect(applyPersistedThemeOnStartup()).toBe(ThemePreference.Dark)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
  })

  it('clears data-color-scheme when stored theme is system', () => {
    document.documentElement.setAttribute('data-color-scheme', 'dark')
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), theme: ThemePreference.System })
    )

    expect(applyPersistedThemeOnStartup()).toBe(ThemePreference.System)
    expect(document.documentElement.hasAttribute('data-color-scheme')).toBe(false)
  })

  it('seeds defaults and applies default theme when storage is empty', () => {
    expect(applyPersistedThemeOnStartup()).toBe(DEFAULT_APP_PREFERENCES.theme)
    expect(document.documentElement.hasAttribute('data-color-scheme')).toBe(false)
    expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBeTruthy()
  })
})
