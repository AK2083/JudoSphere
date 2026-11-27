import { type FeedbackDraftStatus, type FeedbackDraftWrite, upsertFeedbackDraft } from '@shared/api'

/**
 *
 */
export type SaveFeedbackDraftInput = {
  id: string
  notes: string
  fingerprint?: string | null
  /** Already host-sanitized log excerpt JSON (or null when none attached). */
  logExcerptJson?: string | null
  status?: FeedbackDraftStatus
}

/**
 * Persists a local feedback draft in SQLite (no cloud upload).
 * @param input - Draft fields; `logExcerptJson` should already be sanitized for display consistency.
 */
export async function saveFeedbackDraft(input: SaveFeedbackDraftInput): Promise<void> {
  const draft: FeedbackDraftWrite = {
    id: input.id,
    notes: input.notes,
    fingerprint: input.fingerprint ?? null,
    logExcerptJson: input.logExcerptJson ?? null,
    status: input.status ?? 'ready'
  }
  await upsertFeedbackDraft(draft)
}
