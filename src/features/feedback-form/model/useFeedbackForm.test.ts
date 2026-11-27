import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { KnownFingerprint } from '@shared/api'

import translationKeys from '../i18n/keys'
import { useFeedbackForm } from './useFeedbackForm'

function knownRow(status: KnownFingerprint['status'], fingerprint = 'fp-a'): KnownFingerprint {
  return {
    fingerprint,
    status,
    remoteRef: null,
    notes: null,
    createdAt: 't0',
    updatedAt: 't1'
  }
}

describe('useFeedbackForm', () => {
  it('keeps notes editable and seeds initialNotes', () => {
    const form = useFeedbackForm({ initialNotes: 'mat assignment' })

    expect(form.notes.value).toBe('mat assignment')
    form.setNotes('weigh-in desk')
    expect(form.notes.value).toBe('weigh-in desk')
  })

  it('shows none when no fingerprint is linked and does not call the loader', async () => {
    const load = vi.fn()
    const form = useFeedbackForm({ loadKnownFingerprint: load })

    await nextTick()
    await Promise.resolve()

    expect(load).not.toHaveBeenCalled()
    expect(form.knownDisplay.value).toBe('none')
    expect(form.knownStatusMessageKey.value).toBe(translationKeys.knownStatusNone)
    expect(form.loadState.value).toBe('ready')
  })

  it('loads known status from the host and maps plain-language keys', async () => {
    const load = vi.fn().mockResolvedValue(knownRow('known'))
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    expect(load).toHaveBeenCalledWith('fp-a')
    expect(form.knownEntry.value).toEqual(knownRow('known'))
    expect(form.knownDisplay.value).toBe('known')
    expect(form.knownStatusMessageKey.value).toBe(translationKeys.knownStatusKnown)
  })

  it('treats a missing cache row as new', async () => {
    const load = vi.fn().mockResolvedValue(null)
    const form = useFeedbackForm({
      fingerprint: 'fp-new',
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    expect(form.knownDisplay.value).toBe('new')
    expect(form.knownStatusMessageKey.value).toBe(translationKeys.knownStatusNew)
  })

  it('maps in_progress from the cache', async () => {
    const load = vi.fn().mockResolvedValue(knownRow('in_progress'))
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    expect(form.knownDisplay.value).toBe('in_progress')
    expect(form.knownStatusMessageKey.value).toBe(translationKeys.knownStatusInProgress)
  })

  it('surfaces a load error in plain language without throwing', async () => {
    const load = vi.fn().mockRejectedValue(new Error('db locked'))
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    expect(form.loadFailed.value).toBe(true)
    expect(form.knownDisplay.value).toBe('error')
    expect(form.knownStatusMessageKey.value).toBe(translationKeys.knownStatusLoadError)
  })

  it('uses knownStatusOverride without calling the loader', async () => {
    const load = vi.fn()
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      useKnownStatusOverride: true,
      knownStatusOverride: 'in_progress',
      loadKnownFingerprint: load
    })

    await nextTick()
    await Promise.resolve()

    expect(load).not.toHaveBeenCalled()
    expect(form.knownDisplay.value).toBe('in_progress')
  })

  it('reloads when the fingerprint ref changes', async () => {
    const fingerprint = ref<string | null>('fp-1')
    const load = vi
      .fn()
      .mockResolvedValueOnce(knownRow('new', 'fp-1'))
      .mockResolvedValueOnce(knownRow('known', 'fp-2'))

    const form = useFeedbackForm({
      fingerprint,
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.knownDisplay.value).toBe('new'))

    fingerprint.value = 'fp-2'
    await vi.waitFor(() => expect(form.knownDisplay.value).toBe('known'))

    expect(load).toHaveBeenCalledTimes(2)
    expect(load).toHaveBeenLastCalledWith('fp-2')
  })

  it('can refreshKnownStatus manually after an error', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(knownRow('known'))

    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      loadKnownFingerprint: load
    })

    await vi.waitFor(() => expect(form.knownDisplay.value).toBe('error'))

    await form.refreshKnownStatus()

    expect(form.knownDisplay.value).toBe('known')
    expect(form.loadFailed.value).toBe(false)
  })

  it('auto-attaches a sanitized extract when logExcerptRaw is provided', async () => {
    const sanitize = vi.fn().mockResolvedValue('{"pin":"[REDACTED]"}')
    const form = useFeedbackForm({
      logExcerptRaw: '{"pin":"4242"}',
      sanitizeLogExtract: sanitize,
      loadKnownFingerprint: vi.fn()
    })

    await vi.waitFor(() => expect(form.attachmentState.value).toBe('attached'))

    expect(sanitize).toHaveBeenCalledWith('{"pin":"4242"}')
    expect(form.attachedExcerpt.value).toBe('{"pin":"[REDACTED]"}')
    expect(form.hasAttachment.value).toBe(true)
  })

  it('attaches a structured sanitized extract on demand', async () => {
    const sanitize = vi.fn().mockImplementation(async (raw: string) => `sanitized:${raw}`)
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      initialNotes: 'desk',
      sanitizeLogExtract: sanitize,
      loadKnownFingerprint: vi.fn().mockResolvedValue(null),
      createDraftId: () => 'draft-fixed'
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    const excerpt = await form.attachSanitizedLogExtract()

    expect(excerpt).toContain('sanitized:')
    expect(sanitize).toHaveBeenCalled()
    expect(form.attachmentState.value).toBe('attached')
  })

  it('records attachment error when sanitize fails', async () => {
    const form = useFeedbackForm({
      sanitizeLogExtract: vi.fn().mockRejectedValue(new Error('sanitize failed')),
      loadKnownFingerprint: vi.fn()
    })

    await expect(form.attachSanitizedLogExtract()).resolves.toBeNull()
    expect(form.attachmentState.value).toBe('error')
    expect(form.hasAttachment.value).toBe(false)
  })

  it('prepares and saves a local ready draft with attached excerpt', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const form = useFeedbackForm({
      fingerprint: 'fp-a',
      initialNotes: 'mats',
      sanitizeLogExtract: vi.fn().mockResolvedValue('{"ok":true}'),
      saveFeedbackDraft: persist,
      loadKnownFingerprint: vi.fn().mockResolvedValue(null),
      createDraftId: () => 'draft-1'
    })

    await vi.waitFor(() => expect(form.loadState.value).toBe('ready'))

    await expect(form.prepareAndSaveDraft()).resolves.toBe('draft-1')

    expect(persist).toHaveBeenCalledWith({
      id: 'draft-1',
      notes: 'mats',
      fingerprint: 'fp-a',
      logExcerptJson: '{"ok":true}',
      status: 'ready'
    })
    expect(form.draftSaveFeedback.value).toBe('success')
    expect(form.lastSavedDraftId.value).toBe('draft-1')
  })

  it('reuses an already attached excerpt when preparing a draft', async () => {
    const sanitize = vi.fn().mockResolvedValue('{"once":true}')
    const persist = vi.fn().mockResolvedValue(undefined)
    const form = useFeedbackForm({
      sanitizeLogExtract: sanitize,
      saveFeedbackDraft: persist,
      loadKnownFingerprint: vi.fn(),
      createDraftId: () => 'draft-2'
    })

    await form.attachSanitizedLogExtract()
    await form.prepareAndSaveDraft()

    expect(sanitize).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'draft-2',
        logExcerptJson: '{"once":true}',
        status: 'ready'
      })
    )
  })

  it('sets prepare error when sanitize fails during save', async () => {
    const form = useFeedbackForm({
      sanitizeLogExtract: vi.fn().mockRejectedValue(new Error('nope')),
      saveFeedbackDraft: vi.fn(),
      loadKnownFingerprint: vi.fn()
    })

    await expect(form.prepareAndSaveDraft()).resolves.toBeNull()
    expect(form.draftSaveFeedback.value).toBe('error')
  })

  it('sets prepare error when draft persist fails', async () => {
    const form = useFeedbackForm({
      sanitizeLogExtract: vi.fn().mockResolvedValue('{"ok":true}'),
      saveFeedbackDraft: vi.fn().mockRejectedValue(new Error('db')),
      loadKnownFingerprint: vi.fn(),
      createDraftId: () => 'draft-x'
    })

    await expect(form.prepareAndSaveDraft()).resolves.toBeNull()
    expect(form.draftSaveFeedback.value).toBe('error')
  })
})
