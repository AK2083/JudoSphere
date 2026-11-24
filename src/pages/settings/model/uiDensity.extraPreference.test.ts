import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import {
  APP_PREFERENCES_STORAGE_KEY,
  LanguageCode,
  loadAppPreferences,
  ThemePreference,
  UiDensityPreference
} from '@shared/lib'

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

/**
 * Focused coverage: write uiDensity through the shared settings API and read it back.
 */
describe('extra preference uiDensity via shared settings API', () => {
  beforeEach(() => {
    localStorage.clear()
    localeRef.value = LanguageCode.EN
    document.documentElement.removeAttribute('data-color-scheme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('writes uiDensity through the settings API and reads it back from the shared bag', async () => {
    const first = mountPreferences()

    expect(first.api.uiDensity.value).toBe(UiDensityPreference.Comfortable)

    first.api.setTheme(ThemePreference.Light)
    first.api.setLanguage(LanguageCode.DE)
    first.api.setUiDensity(UiDensityPreference.Compact)
    await nextTick()

    expect(first.api.persistFeedback.value).toBe('success')
    first.wrapper.unmount()

    const stored = loadAppPreferences()
    expect(stored.theme).toBe(ThemePreference.Light)
    expect(stored.language).toBe(LanguageCode.DE)
    expect(stored.uiDensity).toBe(UiDensityPreference.Compact)
    expect(JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) ?? '')).toMatchObject({
      theme: ThemePreference.Light,
      language: LanguageCode.DE,
      uiDensity: UiDensityPreference.Compact
    })

    const second = mountPreferences()
    expect(second.api.uiDensity.value).toBe(UiDensityPreference.Compact)
    expect(second.api.theme.value).toBe(ThemePreference.Light)
    expect(second.api.language.value).toBe(LanguageCode.DE)
    second.wrapper.unmount()
  })
})
