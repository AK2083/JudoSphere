import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  bumpFingerprintOccurrence,
  getErrorEvent,
  getFeedbackDraft,
  getFingerprintGate,
  getKnownFingerprint,
  insertErrorEvent,
  listErrorEventsByFingerprint,
  listFeedbackDraftsByStatus,
  upsertFeedbackDraft,
  upsertFingerprintGate,
  upsertKnownFingerprint
} from './errorReport'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock
}))

describe('errorReport facade', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    invokeMock.mockResolvedValue(undefined)
  })

  it('inserts and reads error events', async () => {
    const event = {
      id: 'evt-1',
      fingerprint: 'fp-a',
      source: 'ui',
      message: 'boom',
      contextJson: null,
      occurredAt: null
    }
    await insertErrorEvent(event)
    expect(invokeMock).toHaveBeenCalledWith('insert_error_event', { event })

    invokeMock.mockResolvedValueOnce({ ...event, occurredAt: 't', createdAt: 't' })
    await expect(getErrorEvent('evt-1')).resolves.toMatchObject({ id: 'evt-1' })
    expect(invokeMock).toHaveBeenCalledWith('get_error_event', { id: 'evt-1' })

    invokeMock.mockResolvedValueOnce([])
    await expect(listErrorEventsByFingerprint('fp-a')).resolves.toEqual([])
    expect(invokeMock).toHaveBeenCalledWith('list_error_events_by_fingerprint', {
      fingerprint: 'fp-a'
    })
  })

  it('writes and bumps fingerprint gates', async () => {
    const gate = {
      fingerprint: 'fp-a',
      occurrenceCount: 1,
      firstSeenAt: null,
      lastSeenAt: null,
      cooldownUntil: null
    }
    await upsertFingerprintGate(gate)
    expect(invokeMock).toHaveBeenCalledWith('upsert_fingerprint_gate', { gate })

    invokeMock.mockResolvedValueOnce({
      fingerprint: 'fp-a',
      occurrenceCount: 2,
      firstSeenAt: 'a',
      lastSeenAt: 'b',
      cooldownUntil: 'c',
      updatedAt: 'd'
    })
    await expect(bumpFingerprintOccurrence('fp-a', 'c')).resolves.toMatchObject({
      occurrenceCount: 2
    })
    expect(invokeMock).toHaveBeenCalledWith('bump_fingerprint_occurrence', {
      fingerprint: 'fp-a',
      cooldownUntil: 'c'
    })

    invokeMock.mockResolvedValueOnce(null)
    await expect(getFingerprintGate('fp-a')).resolves.toBeNull()
    expect(invokeMock).toHaveBeenCalledWith('get_fingerprint_gate', { fingerprint: 'fp-a' })
  })

  it('upserts known fingerprints and feedback drafts', async () => {
    const entry = {
      fingerprint: 'fp-a',
      status: 'known' as const,
      remoteRef: 'GH-1',
      notes: null
    }
    await upsertKnownFingerprint(entry)
    expect(invokeMock).toHaveBeenCalledWith('upsert_known_fingerprint', { entry })

    invokeMock.mockResolvedValueOnce({
      ...entry,
      notes: null,
      createdAt: 't',
      updatedAt: 't'
    })
    await expect(getKnownFingerprint('fp-a')).resolves.toMatchObject({ status: 'known' })

    const draft = {
      id: 'draft-1',
      fingerprint: 'fp-a',
      notes: 'hall',
      logExcerptJson: null,
      status: 'pending' as const
    }
    await upsertFeedbackDraft(draft)
    expect(invokeMock).toHaveBeenCalledWith('upsert_feedback_draft', { draft })

    invokeMock.mockResolvedValueOnce({
      ...draft,
      fingerprint: 'fp-a',
      logExcerptJson: null,
      createdAt: 't',
      updatedAt: 't'
    })
    await expect(getFeedbackDraft('draft-1')).resolves.toMatchObject({ id: 'draft-1' })

    invokeMock.mockResolvedValueOnce([])
    await expect(listFeedbackDraftsByStatus('pending')).resolves.toEqual([])
    expect(invokeMock).toHaveBeenCalledWith('list_feedback_drafts_by_status', {
      status: 'pending'
    })
  })

  it('passes null cooldown when bump omits the argument', async () => {
    invokeMock.mockResolvedValueOnce({
      fingerprint: 'fp-a',
      occurrenceCount: 1,
      firstSeenAt: 'a',
      lastSeenAt: 'b',
      cooldownUntil: null,
      updatedAt: 'd'
    })
    await bumpFingerprintOccurrence('fp-a')
    expect(invokeMock).toHaveBeenCalledWith('bump_fingerprint_occurrence', {
      fingerprint: 'fp-a',
      cooldownUntil: null
    })
  })
})
