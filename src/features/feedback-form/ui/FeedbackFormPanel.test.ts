import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import { LanguageCode } from '@shared/lib'

import { feedbackFormEn } from '../i18n'
import {
  openFeedbackForm,
  resetFeedbackFormLauncher,
  useFeedbackFormLauncher
} from '../model/useFeedbackFormLauncher'
import FeedbackFormPanel from './FeedbackFormPanel.vue'

vi.mock('../api/fetchKnownFingerprint', () => ({
  fetchKnownFingerprint: vi.fn().mockResolvedValue(null)
}))

vi.mock('../api/sanitizeAttachedLogExtract', () => ({
  sanitizeAttachedLogExtract: vi.fn().mockResolvedValue('{"ok":true}')
}))

vi.mock('../api/saveFeedbackDraft', () => ({
  saveFeedbackDraft: vi.fn().mockResolvedValue(undefined)
}))

function mountPanel() {
  const i18n = createI18n({
    legacy: false,
    locale: LanguageCode.EN,
    fallbackLocale: LanguageCode.EN,
    messages: {
      en: { feedbackForm: feedbackFormEn }
    }
  })

  return mount(FeedbackFormPanel, {
    attachTo: document.body,
    global: {
      plugins: [i18n]
    }
  })
}

describe('FeedbackFormPanel', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
    document.body.innerHTML = ''
  })

  it('renders nothing while closed', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens the shared FeedbackForm for status-bar context', async () => {
    const wrapper = mountPanel()
    openFeedbackForm({
      source: 'status-bar',
      initialNotes: 'from status bar'
    })
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )

    expect(wrapper.get('#feedback-form-title').text()).toBe(feedbackFormEn.title)
    expect((wrapper.get('#feedback-form-notes').element as HTMLTextAreaElement).value).toBe(
      'from status bar'
    )

    wrapper.unmount()
  })

  it('closes via toolbar button, backdrop, and Escape', async () => {
    const wrapper = mountPanel()
    openFeedbackForm({ source: 'recovery', logExcerptRaw: '{"a":1}' })
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )

    const closeButton = wrapper.get('[data-testid="feedback-form-panel-close"]')
    expect(closeButton.attributes('aria-label')).toBe(feedbackFormEn.panelClose)
    expect(closeButton.find('svg').exists()).toBe(true)
    expect(closeButton.text().trim()).toBe('')

    await closeButton.trigger('click')
    expect(useFeedbackFormLauncher().isOpen.value).toBe(false)

    openFeedbackForm({ source: 'status-bar' })
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )
    await wrapper.get('[data-testid="feedback-form-panel-backdrop"]').trigger('click')
    expect(useFeedbackFormLauncher().isOpen.value).toBe(false)

    openFeedbackForm({ source: 'status-bar' })
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )
    await wrapper.get('[data-testid="feedback-form-panel"]').trigger('keydown', { key: 'Escape' })
    expect(useFeedbackFormLauncher().isOpen.value).toBe(false)

    openFeedbackForm({ source: 'status-bar' })
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="feedback-form-panel"]').exists()).toBe(true)
    )
    await wrapper.get('[data-testid="feedback-form-panel"]').trigger('keydown', { key: 'Enter' })
    expect(useFeedbackFormLauncher().isOpen.value).toBe(true)

    wrapper.unmount()
  })

  it('passes knownStatusOverride only when provided on the open context', async () => {
    const wrapper = mountPanel()
    openFeedbackForm({
      source: 'recovery',
      fingerprint: 'fp-k',
      knownStatusOverride: 'known'
    })

    await vi.waitFor(() => expect(wrapper.find('[data-known-status="known"]').exists()).toBe(true))

    wrapper.unmount()
  })
})
