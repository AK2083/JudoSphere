import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import { APP_PREFERENCES_STORAGE_KEY, LanguageCode, ThemePreference } from '@shared/lib'

import { useSettingsPreferences } from './useSettingsPreferences'

const localeRef = { value: LanguageCode.EN }

vi.mock('@shared/api', async () => {
  const actual = await vi.importActual<typeof import('@shared/api')>('@shared/api')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      locale: localeRef
    })
  }
})

function mountPreferences() {
  let api!: ReturnType<typeof useSettingsPreferences>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useSettingsPreferences()
        return () => h('div')
      }
    }),
    {
      global: {
        plugins: [
          createI18n({
            legacy: false,
            locale: LanguageCode.EN,
            messages: { en: {}, de: {} }
          })
        ]
      }
    }
  )
  return { api, wrapper }
}

describe('useSettingsPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
    localeRef.value = LanguageCode.EN
    document.documentElement.removeAttribute('data-color-scheme')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('reflects stored preferences when opened', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: ThemePreference.Dark, language: LanguageCode.DE })
    )

    const { api, wrapper } = mountPreferences()

    expect(api.theme.value).toBe(ThemePreference.Dark)
    expect(api.language.value).toBe(LanguageCode.DE)
    expect(localeRef.value).toBe(LanguageCode.DE)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('dark')

    wrapper.unmount()
  })

  it('updates live theme and persists the shared bag', async () => {
    const { api, wrapper } = mountPreferences()

    api.setTheme(ThemePreference.Light)
    await nextTick()

    expect(api.theme.value).toBe(ThemePreference.Light)
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe('light')
    expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '{}')).toMatchObject({
      theme: ThemePreference.Light
    })

    wrapper.unmount()
  })

  it('updates live locale and persists the shared bag', async () => {
    const { api, wrapper } = mountPreferences()

    api.setLanguage(LanguageCode.DE)
    await nextTick()

    expect(api.language.value).toBe(LanguageCode.DE)
    expect(localeRef.value).toBe(LanguageCode.DE)
    expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '{}')).toMatchObject({
      language: LanguageCode.DE
    })

    wrapper.unmount()
  })
})
