import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import { LanguageCode } from '@shared/lib'

import { feedbackFormDe, feedbackFormEn } from '../i18n'
import FeedbackForm from './FeedbackForm.vue'

const fetchKnownFingerprint = vi.hoisted(() => vi.fn())

vi.mock('../api/fetchKnownFingerprint', () => ({
  fetchKnownFingerprint
}))

function mountForm(
  props: {
    fingerprint?: string | null
    initialNotes?: string
    knownStatusOverride?: 'new' | 'known' | 'in_progress' | null
  } = {},
  locale: LanguageCode = LanguageCode.EN
) {
  const i18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: LanguageCode.EN,
    messages: {
      de: { feedbackForm: feedbackFormDe },
      en: { feedbackForm: feedbackFormEn }
    }
  })

  return mount(FeedbackForm, {
    props,
    global: {
      plugins: [i18n]
    }
  })
}

describe('FeedbackForm', () => {
  it('renders English labels, help text, and accepts notes', async () => {
    const wrapper = mountForm({ knownStatusOverride: null })

    expect(wrapper.get('#feedback-form-title').text()).toBe(feedbackFormEn.title)
    expect(wrapper.text()).toContain(feedbackFormEn.description)
    expect(wrapper.text()).toContain(feedbackFormEn.notesLabel)
    expect(wrapper.text()).toContain(feedbackFormEn.notesHelp)
    expect(wrapper.text()).toContain(feedbackFormEn.knownStatusLabel)
    expect(wrapper.text()).toContain(feedbackFormEn.knownStatusHelp)
    expect(wrapper.get('[role="status"]').text()).toBe(feedbackFormEn.knownStatusNew)

    await wrapper.get('#feedback-form-notes').setValue('Assigning mats on court 2')
    expect((wrapper.get('#feedback-form-notes').element as HTMLTextAreaElement).value).toBe(
      'Assigning mats on court 2'
    )

    wrapper.unmount()
  })

  it('renders German labels and known-status copy', () => {
    const wrapper = mountForm(
      { fingerprint: 'fp-a', knownStatusOverride: 'known' },
      LanguageCode.DE
    )

    expect(wrapper.get('#feedback-form-title').text()).toBe(feedbackFormDe.title)
    expect(wrapper.text()).toContain(feedbackFormDe.notesHelp)
    expect(wrapper.get('[role="status"]').text()).toBe(feedbackFormDe.knownStatusKnown)
    expect(wrapper.get('[data-known-status]').attributes('data-known-status')).toBe('known')

    wrapper.unmount()
  })

  it('shows none when opened without a fingerprint', () => {
    const wrapper = mountForm()

    expect(wrapper.get('[role="status"]').text()).toBe(feedbackFormEn.knownStatusNone)
    expect(wrapper.get('[data-known-status]').attributes('data-known-status')).toBe('none')

    wrapper.unmount()
  })

  it('loads known status from the host when no override is provided', async () => {
    fetchKnownFingerprint.mockReset()
    fetchKnownFingerprint.mockResolvedValue({
      fingerprint: 'fp-host',
      status: 'in_progress',
      remoteRef: null,
      notes: null,
      createdAt: 't0',
      updatedAt: 't1'
    })

    const wrapper = mountForm({ fingerprint: 'fp-host' })

    await vi.waitFor(() =>
      expect(wrapper.get('[role="status"]').text()).toBe(feedbackFormEn.knownStatusInProgress)
    )
    expect(fetchKnownFingerprint).toHaveBeenCalledWith('fp-host')

    wrapper.unmount()
  })

  it('seeds initial notes', () => {
    const wrapper = mountForm({
      initialNotes: 'After crash recovery',
      knownStatusOverride: null
    })

    expect((wrapper.get('#feedback-form-notes').element as HTMLTextAreaElement).value).toBe(
      'After crash recovery'
    )

    wrapper.unmount()
  })

  it('prevents native form submit without uploading', async () => {
    const wrapper = mountForm({ knownStatusOverride: null })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="status"]').text()).toBe(feedbackFormEn.knownStatusNew)

    wrapper.unmount()
  })
})
