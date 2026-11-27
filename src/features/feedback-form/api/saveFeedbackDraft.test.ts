import { beforeEach, describe, expect, it, vi } from 'vitest'

const upsertFeedbackDraft = vi.hoisted(() => vi.fn())

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>()
  return {
    ...actual,
    upsertFeedbackDraft
  }
})

import { saveFeedbackDraft } from './saveFeedbackDraft'

describe('saveFeedbackDraft', () => {
  beforeEach(() => {
    upsertFeedbackDraft.mockReset()
    upsertFeedbackDraft.mockResolvedValue(undefined)
  })

  it('persists a ready local draft with sanitized excerpt', async () => {
    await saveFeedbackDraft({
      id: 'draft-1',
      notes: 'mat desk',
      fingerprint: 'fp-a',
      logExcerptJson: '{"kind":"x"}'
    })

    expect(upsertFeedbackDraft).toHaveBeenCalledWith({
      id: 'draft-1',
      notes: 'mat desk',
      fingerprint: 'fp-a',
      logExcerptJson: '{"kind":"x"}',
      status: 'ready'
    })
  })

  it('defaults missing optional fields for a local-only draft', async () => {
    await saveFeedbackDraft({
      id: 'draft-2',
      notes: 'notes only',
      status: 'pending'
    })

    expect(upsertFeedbackDraft).toHaveBeenCalledWith({
      id: 'draft-2',
      notes: 'notes only',
      fingerprint: null,
      logExcerptJson: null,
      status: 'pending'
    })
  })
})
