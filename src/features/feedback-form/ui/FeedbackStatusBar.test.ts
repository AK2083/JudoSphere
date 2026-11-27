import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { createI18n } from '@shared/api'
import { LanguageCode } from '@shared/lib'

import { feedbackFormDe, feedbackFormEn } from '../i18n'
import {
  offerFeedbackAfterFailure,
  resetFeedbackFormLauncher,
  useFeedbackFormLauncher
} from '../model/useFeedbackFormLauncher'
import FeedbackStatusBar from './FeedbackStatusBar.vue'

function mountBar(locale: LanguageCode = LanguageCode.EN) {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: LanguageCode.EN,
    messages: {
      de: { feedbackForm: feedbackFormDe },
      en: { feedbackForm: feedbackFormEn }
    }
  })

  return mount(FeedbackStatusBar, {
    global: {
      plugins: [i18n]
    }
  })
}

describe('FeedbackStatusBar', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
  })

  it('opens the shared feedback form from the status bar icon button', async () => {
    const wrapper = mountBar()
    const openButton = wrapper.get('[data-testid="feedback-status-open"]')

    expect(openButton.attributes('aria-label')).toBe(feedbackFormEn.statusBarOpen)
    expect(openButton.find('svg').exists()).toBe(true)
    expect(openButton.text().trim()).toBe('')

    await openButton.trigger('click')

    expect(useFeedbackFormLauncher().isOpen.value).toBe(true)
    expect(useFeedbackFormLauncher().context.value.source).toBe('status-bar')
    expect(wrapper.find('[data-testid="app-shell-status-end"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('shows recovery offer copy in German and opens the same form', async () => {
    offerFeedbackAfterFailure({
      fingerprint: 'fp-recovery',
      logExcerptRaw: '{"message":"boom"}'
    })

    const wrapper = mountBar(LanguageCode.DE)

    expect(wrapper.get('[data-testid="feedback-recovery-offer"]').text()).toContain(
      feedbackFormDe.recoveryOffer
    )

    await wrapper.get('[data-testid="feedback-recovery-open"]').trigger('click')

    const launcher = useFeedbackFormLauncher()
    expect(launcher.isOpen.value).toBe(true)
    expect(launcher.context.value.source).toBe('recovery')
    expect(launcher.context.value.fingerprint).toBe('fp-recovery')
    expect(launcher.recoveryAvailable.value).toBe(false)

    wrapper.unmount()
  })

  it('dismisses the recovery offer without opening the form', async () => {
    offerFeedbackAfterFailure({ logExcerptRaw: '{"x":1}' })
    const wrapper = mountBar()

    await wrapper.get('[data-testid="feedback-recovery-dismiss"]').trigger('click')

    expect(wrapper.find('[data-testid="feedback-recovery-offer"]').exists()).toBe(false)
    expect(useFeedbackFormLauncher().isOpen.value).toBe(false)
    expect(useFeedbackFormLauncher().recoveryAvailable.value).toBe(false)

    wrapper.unmount()
  })
})
