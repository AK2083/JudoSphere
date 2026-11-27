import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { createI18n } from '@shared/api'
import { LanguageCode } from '@shared/lib'

import { feedbackFormDe, feedbackFormEn } from '../i18n'
import { FEEDBACK_NOTES_MAX_LENGTH } from '../model/notesLimits'
import FeedbackForm from './FeedbackForm.vue'

const fetchKnownFingerprint = vi.hoisted(() => vi.fn())
const sanitizeAttachedLogExtract = vi.hoisted(() => vi.fn())
const saveFeedbackDraft = vi.hoisted(() => vi.fn())

vi.mock('../api/fetchKnownFingerprint', () => ({
  fetchKnownFingerprint
}))

vi.mock('../api/sanitizeAttachedLogExtract', () => ({
  sanitizeAttachedLogExtract
}))

vi.mock('../api/saveFeedbackDraft', () => ({
  saveFeedbackDraft
}))

function mountForm(
  props: {
    fingerprint?: string | null
    initialNotes?: string
    logExcerptRaw?: string | null
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
    expect(wrapper.text()).toContain(feedbackFormEn.attachmentLabel)
    expect(wrapper.get('[role="status"]').text()).toContain(feedbackFormEn.knownStatusNew)

    expect(wrapper.get('[data-testid="feedback-form-notes-count"]').text()).toBe(
      `0 / ${FEEDBACK_NOTES_MAX_LENGTH}`
    )

    await wrapper.get('#feedback-form-notes').setValue('Assigning mats on court 2')
    expect((wrapper.get('#feedback-form-notes').element as HTMLTextAreaElement).value).toBe(
      'Assigning mats on court 2'
    )
    expect(wrapper.get('[data-testid="feedback-form-notes-count"]').text()).toBe(
      `25 / ${FEEDBACK_NOTES_MAX_LENGTH}`
    )
    expect(
      (wrapper.get('#feedback-form-notes').element as HTMLTextAreaElement).getAttribute('maxlength')
    ).toBe(String(FEEDBACK_NOTES_MAX_LENGTH))

    wrapper.unmount()
  })

  it('renders German labels and known-status copy', () => {
    const wrapper = mountForm(
      { fingerprint: 'fp-a', knownStatusOverride: 'known' },
      LanguageCode.DE
    )

    expect(wrapper.get('#feedback-form-title').text()).toBe(feedbackFormDe.title)
    expect(wrapper.text()).toContain(feedbackFormDe.notesHelp)
    expect(wrapper.text()).toContain(feedbackFormDe.knownStatusKnown)
    expect(wrapper.get('[data-known-status]').attributes('data-known-status')).toBe('known')

    wrapper.unmount()
  })

  it('shows none when opened without a fingerprint', () => {
    const wrapper = mountForm()

    expect(wrapper.text()).toContain(feedbackFormEn.knownStatusNone)
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

    await vi.waitFor(() => expect(wrapper.text()).toContain(feedbackFormEn.knownStatusInProgress))
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

  it('keeps the caret on right-click so paste does not replace the whole word', async () => {
    const wrapper = mountForm({
      initialNotes: 'Assigning mats',
      knownStatusOverride: null
    })
    const notes = wrapper.get('#feedback-form-notes')
    const el = notes.element as HTMLTextAreaElement

    el.focus()
    el.setSelectionRange(4, 4)
    await notes.trigger('mousedown', { button: 2 })

    el.setSelectionRange(0, 9)
    await notes.trigger('contextmenu')
    await Promise.resolve()

    expect(el.selectionStart).toBe(4)
    expect(el.selectionEnd).toBe(4)

    el.setSelectionRange(2, 6)
    await notes.trigger('mousedown', { button: 2 })
    el.setSelectionRange(0, 9)
    await notes.trigger('contextmenu')
    await Promise.resolve()
    expect(el.selectionStart).toBe(0)
    expect(el.selectionEnd).toBe(9)

    el.setSelectionRange(1, 1)
    await notes.trigger('mousedown', { button: 0 })
    el.setSelectionRange(0, 9)
    await notes.trigger('contextmenu')
    await Promise.resolve()
    expect(el.selectionStart).toBe(0)
    expect(el.selectionEnd).toBe(9)

    wrapper.unmount()
  })

  it('prevents native form submit without uploading', async () => {
    const wrapper = mountForm({ knownStatusOverride: null })

    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain(feedbackFormEn.knownStatusNew)

    wrapper.unmount()
  })

  it('shows a missing-extract error when attach is pressed without log data', async () => {
    sanitizeAttachedLogExtract.mockReset()

    const wrapper = mountForm({ knownStatusOverride: null, initialNotes: 'notes' })

    await wrapper.get('button.feedback-form__button--secondary').trigger('click')

    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-attachment-status"]').element as HTMLInputElement)
          .value
      ).toBe(feedbackFormEn.attachmentMissing)
    )
    expect(sanitizeAttachedLogExtract).not.toHaveBeenCalled()
    expect(wrapper.get('[data-attachment-state]').attributes('data-attachment-state')).toBe('error')
    expect(wrapper.find('[data-testid="feedback-form-attachment-ready"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('auto-attaches when logExcerptRaw is provided and shows the excerpt preview', async () => {
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockResolvedValue('{"ok":true}')

    const wrapper = mountForm({
      knownStatusOverride: null,
      logExcerptRaw: '{"secret":"x"}'
    })

    await vi.waitFor(() =>
      expect(wrapper.get('[data-attachment-state]').attributes('data-attachment-state')).toBe(
        'attached'
      )
    )
    expect(sanitizeAttachedLogExtract).toHaveBeenCalledWith('{"secret":"x"}')
    expect(
      (wrapper.get('[data-testid="feedback-form-attachment-status"]').element as HTMLInputElement)
        .value
    ).toBe('{"ok":true}')
    expect(wrapper.find('[data-testid="feedback-form-attachment-ready"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('keeps prepare disabled until notes and an attached extract exist', async () => {
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockResolvedValue('{"ok":true}')

    const wrapper = mountForm({ knownStatusOverride: null })

    expect(
      (wrapper.get('[data-testid="feedback-form-prepare"]').element as HTMLButtonElement).disabled
    ).toBe(true)

    await wrapper.get('#feedback-form-notes').setValue('pool sheet')
    expect(
      (wrapper.get('[data-testid="feedback-form-prepare"]').element as HTMLButtonElement).disabled
    ).toBe(true)

    wrapper.unmount()

    const ready = mountForm({
      knownStatusOverride: null,
      initialNotes: 'pool sheet',
      logExcerptRaw: '{"secret":"x"}'
    })

    await vi.waitFor(() =>
      expect(
        (ready.get('[data-testid="feedback-form-prepare"]').element as HTMLButtonElement).disabled
      ).toBe(false)
    )

    ready.unmount()
  })

  it('prepares and saves a local draft without cloud upload', async () => {
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockResolvedValue('{"ok":true}')
    saveFeedbackDraft.mockReset()
    saveFeedbackDraft.mockResolvedValue(undefined)

    const wrapper = mountForm({
      fingerprint: 'fp-a',
      knownStatusOverride: 'new',
      initialNotes: 'pool sheet',
      logExcerptRaw: '{"secret":"x"}'
    })

    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-prepare"]').element as HTMLButtonElement).disabled
      ).toBe(false)
    )
    await wrapper.get('[data-testid="feedback-form-prepare"]').trigger('click')

    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="feedback-form-prepare-success"]').text()).toBe(
        feedbackFormEn.prepareSuccess
      )
    )
    expect(saveFeedbackDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'pool sheet',
        fingerprint: 'fp-a',
        logExcerptJson: '{"ok":true}',
        status: 'ready'
      })
    )

    wrapper.unmount()
  })

  it('shows prepare error when draft save fails', async () => {
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockResolvedValue('{"ok":true}')
    saveFeedbackDraft.mockReset()
    saveFeedbackDraft.mockRejectedValue(new Error('db'))

    const wrapper = mountForm({
      knownStatusOverride: null,
      initialNotes: 'pool sheet',
      logExcerptRaw: '{"secret":"x"}'
    })

    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-prepare"]').element as HTMLButtonElement).disabled
      ).toBe(false)
    )
    await wrapper.get('[data-testid="feedback-form-prepare"]').trigger('click')

    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="feedback-form-prepare-error"]').text()).toBe(
        feedbackFormEn.prepareError
      )
    )

    wrapper.unmount()
  })

  it('shows attachment error when sanitize fails', async () => {
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockRejectedValue(new Error('sanitize failed'))

    const wrapper = mountForm({
      knownStatusOverride: null,
      logExcerptRaw: '{"pin":"1"}'
    })

    await wrapper.get('button.feedback-form__button--secondary').trigger('click')

    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-attachment-status"]').element as HTMLInputElement)
          .value
      ).toBe(feedbackFormEn.attachmentError)
    )
    expect(wrapper.get('[data-attachment-state]').attributes('data-attachment-state')).toBe('error')

    wrapper.unmount()
  })

  it('shows attaching status while sanitize is in flight', async () => {
    let resolveSanitize: ((value: string) => void) | undefined
    sanitizeAttachedLogExtract.mockReset()
    sanitizeAttachedLogExtract.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveSanitize = resolve
        })
    )

    const wrapper = mountForm({
      knownStatusOverride: null,
      logExcerptRaw: '{"pending":true}'
    })

    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-attachment-status"]').element as HTMLInputElement)
          .value
      ).toBe(feedbackFormEn.attachmentAttaching)
    )

    resolveSanitize?.('{"ok":true}')
    await vi.waitFor(() =>
      expect(
        (wrapper.get('[data-testid="feedback-form-attachment-status"]').element as HTMLInputElement)
          .value
      ).toBe('{"ok":true}')
    )

    wrapper.unmount()
  })
})
