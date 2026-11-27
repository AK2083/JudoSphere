import type { App } from 'vue'

import { feedbackFormDe, feedbackFormEn } from '@features/feedback-form'
import { greetDe, greetEn } from '@features/greet'
import { homeDe, homeEn } from '@pages/home'
import { settingsDe, settingsEn } from '@pages/settings'
import { createI18n } from '@shared/api'
import { applyPersistedLanguageOnStartup, FallbackLanguage, sharedDe, sharedEn } from '@shared/lib'
import { appNavigationDe, appNavigationEn, brandNotchDe, brandNotchEn } from '@widgets'

import appDe from './de'
import appEn from './en'

/**
 * Root vue-i18n instance with app, shared, widget, page, and feature message bundles.
 * Features may aggregate nested slice messages (DojoSphere `authentication` pattern).
 * Initial `locale` is `FallbackLanguage`; `setupI18n` applies the persisted preference.
 */
export const i18n = createI18n({
  legacy: false,
  locale: FallbackLanguage,
  fallbackLocale: FallbackLanguage,
  messages: {
    de: {
      app: appDe,
      shared: sharedDe,
      brandNotch: brandNotchDe,
      appNavigation: appNavigationDe,
      home: homeDe,
      settings: settingsDe,
      greet: greetDe,
      feedbackForm: feedbackFormDe
    },
    en: {
      app: appEn,
      shared: sharedEn,
      brandNotch: brandNotchEn,
      appNavigation: appNavigationEn,
      home: homeEn,
      settings: settingsEn,
      greet: greetEn,
      feedbackForm: feedbackFormEn
    }
  }
})

/**
 * Registers i18n on the Vue application composition root and applies the
 * persisted language from the shared `localStorage` preferences model.
 * @param app - Vue application instance
 */
export function setupI18n(app: App): void {
  app.use(i18n)
  applyPersistedLanguageOnStartup((language) => {
    i18n.global.locale.value = language
  })
}

export { default as appTranslationKeys } from './keys'
