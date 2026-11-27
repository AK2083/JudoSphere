/**
 * Inputs used to build the JSON log extract attached to a feedback draft.
 */
export type BuildLogExcerptPayloadInput = {
  fingerprint: string | null
  notes: string
  /** Caller-supplied raw extract (e.g. recovery flow). Preferred when non-empty. */
  rawExcerpt?: string | null
}

/**
 * Builds the unsanitized JSON (or passthrough raw) extract that will be sent through
 * the host sanitizer before attach/persist.
 * @param input - Fingerprint, notes, and optional raw excerpt.
 * @returns Raw extract string for `sanitize_log_extract`.
 */
export function buildLogExcerptPayload(input: BuildLogExcerptPayloadInput): string {
  const raw = input.rawExcerpt?.trim()
  if (raw) {
    return raw
  }

  return JSON.stringify({
    kind: 'judosphere.feedback-log-excerpt',
    fingerprint: input.fingerprint,
    notes: input.notes,
    attachedAt: new Date().toISOString()
  })
}
