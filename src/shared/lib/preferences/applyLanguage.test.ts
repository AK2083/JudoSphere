import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FallbackLanguage, LanguageCode } from '../i18n'
import { applyDocumentLanguage, applyPersistedLanguageOnStartup } from './applyLanguage'
import {
  APP_PREFERENCES_STORAGE_KEY,
  createDefaultAppPreferences,
  DEFAULT_APP_PREFERENCES
} from './defaults'

describe('applyDocumentLanguage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.setAttribute('lang', 'de')
  })

  it('sets the document lang attribute', () => {
    applyDocumentLanguage(LanguageCode.EN)
    expect(document.documentElement.getAttribute('lang')).toBe('en')

    applyDocumentLanguage(LanguageCode.DE)
    expect(document.documentElement.getAttribute('lang')).toBe('de')
  })

  it('no-ops when document root is unavailable', () => {
    vi.stubGlobal('document', undefined)

    expect(() => applyDocumentLanguage(LanguageCode.EN)).not.toThrow()
  })
})

describe('applyPersistedLanguageOnStartup', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('lang', 'de')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.setAttribute('lang', 'de')
  })

  it('applies a stored de language via the locale setter and document lang', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), language: LanguageCode.DE })
    )
    const applyLocale = vi.fn()

    expect(applyPersistedLanguageOnStartup(applyLocale)).toBe(LanguageCode.DE)
    expect(applyLocale).toHaveBeenCalledWith(LanguageCode.DE)
    expect(document.documentElement.getAttribute('lang')).toBe('de')
  })

  it('applies a stored en language via the locale setter and document lang', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), language: LanguageCode.EN })
    )
    const applyLocale = vi.fn()

    expect(applyPersistedLanguageOnStartup(applyLocale)).toBe(LanguageCode.EN)
    expect(applyLocale).toHaveBeenCalledWith(LanguageCode.EN)
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('seeds defaults and applies default language when storage is empty', () => {
    const applyLocale = vi.fn()

    expect(applyPersistedLanguageOnStartup(applyLocale)).toBe(DEFAULT_APP_PREFERENCES.language)
    expect(applyLocale).toHaveBeenCalledWith(FallbackLanguage)
    expect(document.documentElement.getAttribute('lang')).toBe(FallbackLanguage)
    expect(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY)).toBeTruthy()
  })

  it('falls back safely when stored language is invalid', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ ...createDefaultAppPreferences(), language: 'fr' })
    )
    const applyLocale = vi.fn()

    expect(applyPersistedLanguageOnStartup(applyLocale)).toBe(FallbackLanguage)
    expect(applyLocale).toHaveBeenCalledWith(FallbackLanguage)
    expect(document.documentElement.getAttribute('lang')).toBe(FallbackLanguage)
  })
})
