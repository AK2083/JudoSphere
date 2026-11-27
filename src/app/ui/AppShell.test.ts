import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  feedbackFormEn,
  offerFeedbackAfterFailure,
  resetFeedbackFormLauncher,
  useFeedbackFormLauncher
} from '@features/feedback-form'
import { createI18n } from '@shared/api'
import { LanguageCode } from '@shared/lib'
import { appNavigationDe, appNavigationEn, brandNotchDe, brandNotchEn } from '@widgets'

import AppShell from './AppShell.vue'

vi.mock('@features/feedback-form/api/fetchKnownFingerprint', () => ({
  fetchKnownFingerprint: vi.fn().mockResolvedValue(null)
}))

vi.mock('@features/feedback-form/api/sanitizeAttachedLogExtract', () => ({
  sanitizeAttachedLogExtract: vi.fn().mockResolvedValue('{"ok":true}')
}))

vi.mock('@features/feedback-form/api/saveFeedbackDraft', () => ({
  saveFeedbackDraft: vi.fn().mockResolvedValue(undefined)
}))

async function mountShell() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div>home</div>' } }]
  })
  await router.push('/')
  await router.isReady()

  const i18n = createI18n({
    legacy: false,
    locale: LanguageCode.EN,
    fallbackLocale: LanguageCode.EN,
    messages: {
      en: {
        feedbackForm: feedbackFormEn,
        appNavigation: appNavigationEn,
        brandNotch: brandNotchEn
      },
      de: {
        feedbackForm: feedbackFormEn,
        appNavigation: appNavigationDe,
        brandNotch: brandNotchDe
      }
    }
  })

  return mount(AppShell, {
    attachTo: document.body,
    global: {
      plugins: [router, i18n]
    }
  })
}

describe('AppShell feedback entry points', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
    document.body.innerHTML = ''
  })

  it('opens the shared feedback form from the status bar', async () => {
    const wrapper = await mountShell()

    await wrapper.get('[data-testid="feedback-status-open"]').trigger('click')

    expect(useFeedbackFormLauncher().isOpen.value).toBe(true)
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )
    expect(wrapper.get('#feedback-form-title').text()).toBe(feedbackFormEn.title)

    wrapper.unmount()
  })

  it('reuses the same form from the recovery offer in the status bar', async () => {
    offerFeedbackAfterFailure({
      fingerprint: 'fp-shell',
      logExcerptRaw: '{"kind":"failure"}'
    })

    const wrapper = await mountShell()

    expect(wrapper.find('[data-testid="feedback-recovery-offer"]').exists()).toBe(true)
    await wrapper.get('[data-testid="feedback-recovery-open"]').trigger('click')

    expect(useFeedbackFormLauncher().context.value.source).toBe('recovery')
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )

    wrapper.unmount()
  })
})
