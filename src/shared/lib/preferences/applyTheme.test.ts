import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  applyPersistedThemeOnStartup,
  applyThemePreference,
  resolveSystemColorScheme,
  stopSystemThemeWatch
} from './applyTheme'
import {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCES
} from './defaults'
import { ThemePreference } from './types'

type MediaListener = (event: MediaQueryListEvent) => void

function stubMatchMedia(matches: boolean): {
  media: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }
  emit: (nextMatches: boolean) => void
} {
  const listeners = new Set<MediaListener>()
  const media = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.add(listener)
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.delete(listener)
    }),
    dispatchEvent: vi.fn(),
    onchange: null
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media)
  )

  return {
    media,
    emit(nextMatches: boolean) {
      media.matches = nextMatches
      for (const listener of listeners) {
        listener({ matches: nextMatches } as MediaQueryListEvent)
      }
    }
  }
}

describe('resolveSystemColorScheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns dark when the OS prefers dark', () => {
    stubMatchMedia(true)
    expect(resolveSystemColorScheme()).toBe('dark')
  })

  it('returns light when the OS prefers light', () => {
    stubMatchMedia(false)
    expect(resolveSystemColorScheme()).toBe('light')
  })

  it('falls back to light when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(resolveSystemColorScheme()).toBe('light')
  })
})

describe('applyThemePreference', () => {
  afterEach(() => {
    stopSystemThemeWatch()
    vi.unstubAllGlobals()
    document.documentElement?.removeAttribute('data-color-scheme')
  })

  it('sets light and dark data-color-scheme attributes', () => {
    applyThemePreference(ThemePreference.Light)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')

    applyThemePreference(ThemePreference.Dark)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
  })

  it('mirrors the current OS appearance for system preference', () => {
    stubMatchMedia(true)
    applyThemePreference(ThemePreference.System)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
  })

  it('updates the document when OS appearance changes while theme is system', () => {
    const { media, emit } = stubMatchMedia(false)
    applyThemePreference(ThemePreference.System)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

    emit(true)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')

    emit(false)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
  })

  it('stops tracking OS appearance after switching to an explicit theme', () => {
    const { media, emit } = stubMatchMedia(true)
    applyThemePreference(ThemePreference.System)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')

    applyThemePreference(ThemePreference.Light)
    expect(media.removeEventListener).toHaveBeenCalled()
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')

    emit(false)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
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
    stopSystemThemeWatch()
    vi.unstubAllGlobals()
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

  it('applies resolved OS appearance when stored theme is system', () => {
    stubMatchMedia(false)
    document.documentElement.setAttribute('data-color-scheme', 'dark')
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), theme: ThemePreference.System })
    )

    expect(applyPersistedThemeOnStartup()).toBe(ThemePreference.System)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
  })

  it('seeds defaults and applies system theme when storage is empty', () => {
    stubMatchMedia(true)
    expect(applyPersistedThemeOnStartup()).toBe(DEFAULT_APP_PREFERENCES.theme)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')
    expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBeTruthy()
  })
})
