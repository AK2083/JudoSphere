import type { Ref } from 'vue'
import { createI18n as createVueI18n, type I18n, useI18n } from 'vue-i18n'

/**
 * Creates a vue-i18n instance for app / Storybook provider wiring.
 * Swap this facade if the i18n library changes; callers keep using `@shared/api`.
 */
export const createI18n = createVueI18n

/**
 * Message translator used by features, pages, and widgets.
 * Structural shape stays JSDoc-parseable (no indexed TypeScript access types).
 */
export type TranslateFunction = (key: string, ...args: unknown[]) => string

/**
 * Translation helpers exposed to features, pages, and widgets.
 * Callers must pass keys from slice/shared `keys.ts` objects — never raw string literals.
 */
export type TranslationApi = {
  t: TranslateFunction
  locale: Ref<string>
}

/**
 * Returns the global translation API without coupling UI to vue-i18n directly.
 * @returns Translation function `t` and reactive `locale`
 */
export function useTranslation(): TranslationApi {
  const { t, locale } = useI18n({ useScope: 'global' })

  return {
    t: t as TranslateFunction,
    locale: locale as Ref<string>
  }
}

export type { I18n }
