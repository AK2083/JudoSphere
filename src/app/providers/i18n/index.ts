import { greetDe, greetEn } from '@features/greet'
import { homeDe, homeEn } from '@pages/home'
import { type App, createI18n } from '@shared/api'
import { FallbackLanguage, sharedDe, sharedEn } from '@shared/lib'
import { appNavigationDe, appNavigationEn, brandNotchDe, brandNotchEn } from '@widgets'

import appDe from './de'
import appEn from './en'

/**
 * Root vue-i18n instance with app, shared, widget, page, and feature message bundles.
 * Features may aggregate nested slice messages (DojoSphere `authentication` pattern).
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
      greet: greetDe
    },
    en: {
      app: appEn,
      shared: sharedEn,
      brandNotch: brandNotchEn,
      appNavigation: appNavigationEn,
      home: homeEn,
      greet: greetEn
    }
  }
})

/**
 * Registers i18n on the Vue application composition root.
 * @param app - Vue application instance
 */
export function setupI18n(app: App): void {
  app.use(i18n)
}

export { default as appTranslationKeys } from './keys'
