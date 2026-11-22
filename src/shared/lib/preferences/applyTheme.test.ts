import { afterEach, describe, expect, it, vi } from 'vitest'

import { applyThemePreference } from './applyTheme'
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
