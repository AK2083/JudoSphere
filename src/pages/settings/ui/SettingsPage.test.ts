import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import { APP_PREFERENCES_STORAGE_KEY, LanguageCode, ThemePreference } from '@shared/lib'

import { settingsDe, settingsEn } from '../i18n'
import SettingsPage from './SettingsPage.vue'

function mountPage(locale: LanguageCode = LanguageCode.EN) {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: LanguageCode.EN,
    messages: {
      de: { settings: settingsDe },
      en: { settings: settingsEn }
    }
  })

  return mount(SettingsPage, {
    global: {
      plugins: [i18n]
    }
  })
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    localStorage.clear()
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('renders German labels and help text from i18n', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: ThemePreference.System, language: LanguageCode.DE })
    )

    const wrapper = mountPage(LanguageCode.DE)

    expect(wrapper.get('h1').text()).toBe(settingsDe.title)
    expect(wrapper.text()).toContain(settingsDe.description)
    expect(wrapper.text()).toContain(settingsDe.themeLabel)
    expect(wrapper.text()).toContain(settingsDe.themeHelp)
    expect(wrapper.text()).toContain(settingsDe.languageLabel)
    expect(wrapper.text()).toContain(settingsDe.languageHelp)
    expect(wrapper.text()).toContain(settingsDe.themeLight)
    expect(wrapper.text()).toContain(settingsDe.themeDark)
    expect(wrapper.text()).toContain(settingsDe.themeSystem)

    wrapper.unmount()
  })

  it('updates settings copy when the language control switches locale', async () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: ThemePreference.System, language: LanguageCode.DE })
    )

    const wrapper = mountPage(LanguageCode.DE)

    expect(wrapper.get('h1').text()).toBe(settingsDe.title)

    await wrapper.get('#settings-language').setValue(LanguageCode.EN)

    expect(wrapper.get('h1').text()).toBe(settingsEn.title)
    expect(wrapper.text()).toContain(settingsEn.themeHelp)
    expect(wrapper.text()).toContain(settingsEn.languageHelp)
    expect(wrapper.text()).toContain(settingsEn.saveSuccess)

    wrapper.unmount()
  })

  it('exposes success feedback to assistive tech after a save', async () => {
    const wrapper = mountPage(LanguageCode.EN)

    await wrapper.get('button[aria-pressed]').trigger('click')

    const feedback = wrapper.get('[role="status"]')
    expect(feedback.attributes('aria-live')).toBe('polite')
    expect(feedback.text()).toBe(settingsEn.saveSuccess)

    wrapper.unmount()
  })

  it('exposes error feedback to assistive tech when persist fails', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ theme: ThemePreference.System, language: LanguageCode.EN }),
      setItem: () => {
        throw new Error('quota')
      },
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    })

    const wrapper = mountPage(LanguageCode.EN)
    await wrapper.get('button[aria-pressed]').trigger('click')

    const feedback = wrapper.get('[role="alert"]')
    expect(feedback.attributes('aria-live')).toBe('assertive')
    expect(feedback.text()).toBe(settingsEn.saveError)

    wrapper.unmount()
  })

  it('keeps theme and language controls keyboard reachable', () => {
    localStorage.setItem(
      APP_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ theme: ThemePreference.System, language: LanguageCode.EN })
    )

    const wrapper = mountPage(LanguageCode.EN)
    const themeButtons = wrapper.findAll('button[aria-pressed]')
    const languageSelect = wrapper.get('#settings-language')

    expect(themeButtons).toHaveLength(3)
    for (const button of themeButtons) {
      expect(button.attributes('type')).toBe('button')
      expect(button.attributes('disabled')).toBeUndefined()
    }
    expect(languageSelect.attributes('disabled')).toBeUndefined()
    expect(languageSelect.attributes('aria-describedby')).toBe('settings-language-help')

    wrapper.unmount()
  })
})
