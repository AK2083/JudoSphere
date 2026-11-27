import { invoke } from '@tauri-apps/api/core'

/** Allowed statuses for the local known-fingerprint cache. */
export type KnownFingerprintStatus = 'new' | 'known' | 'in_progress'

/** Local-only feedback draft lifecycle (no upload in this milestone). */
export type FeedbackDraftStatus = 'pending' | 'ready' | 'discarded'

/** Input for inserting an error/report event. */
export type NewErrorEvent = {
  id: string
  fingerprint: string
  source: string
  message: string
  contextJson?: string | null
  occurredAt?: string | null
}

/** Stored error/report event row. */
export type ErrorEvent = {
  id: string
  fingerprint: string
  source: string
  message: string
  contextJson: string | null
  occurredAt: string
  createdAt: string
}

/** Upsert payload for occurrence/cooldown gate state. */
export type FingerprintGateWrite = {
  fingerprint: string
  occurrenceCount: number
  firstSeenAt?: string | null
  lastSeenAt?: string | null
  cooldownUntil?: string | null
}

/** Stored fingerprint gate row. */
export type FingerprintGate = {
  fingerprint: string
  occurrenceCount: number
  firstSeenAt: string
  lastSeenAt: string
  cooldownUntil: string | null
  updatedAt: string
}

/** Upsert payload for the known-fingerprint cache. */
export type KnownFingerprintWrite = {
  fingerprint: string
  status: KnownFingerprintStatus
  remoteRef?: string | null
  notes?: string | null
}

/** Stored known-fingerprint cache row. */
export type KnownFingerprint = {
  fingerprint: string
  status: KnownFingerprintStatus
  remoteRef: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Upsert payload for a local feedback draft. */
export type FeedbackDraftWrite = {
  id: string
  fingerprint?: string | null
  notes: string
  logExcerptJson?: string | null
  status: FeedbackDraftStatus
}

/** Stored feedback draft row. */
export type FeedbackDraft = {
  id: string
  fingerprint: string | null
  notes: string
  logExcerptJson: string | null
  status: FeedbackDraftStatus
  createdAt: string
  updatedAt: string
}

/**
 * Inserts an error/report event into the host SQLite database.
 * @param event - Event payload (caller-provided id).
 */
export async function insertErrorEvent(event: NewErrorEvent): Promise<void> {
  await invoke('insert_error_event', { event })
}

/**
 * Loads one error/report event by id.
 * @param id - Event id.
 * @returns The event, or `null` when missing.
 */
export async function getErrorEvent(id: string): Promise<ErrorEvent | null> {
  return invoke<ErrorEvent | null>('get_error_event', { id })
}

/**
 * Lists error/report events for a fingerprint (newest first).
 * @param fingerprint - Stable error fingerprint.
 * @returns Matching events, newest first.
 */
export async function listErrorEventsByFingerprint(fingerprint: string): Promise<ErrorEvent[]> {
  return invoke<ErrorEvent[]>('list_error_events_by_fingerprint', { fingerprint })
}

/**
 * Upserts occurrence/cooldown gate state for a fingerprint.
 * @param gate - Gate write payload.
 */
export async function upsertFingerprintGate(gate: FingerprintGateWrite): Promise<void> {
  await invoke('upsert_fingerprint_gate', { gate })
}

/**
 * Bumps occurrence count for a fingerprint and optionally sets cooldown.
 * @param fingerprint - Stable error fingerprint.
 * @param cooldownUntil - Optional cooldown timestamp.
 * @returns Updated gate row after the bump.
 */
export async function bumpFingerprintOccurrence(
  fingerprint: string,
  cooldownUntil?: string | null
): Promise<FingerprintGate> {
  return invoke<FingerprintGate>('bump_fingerprint_occurrence', {
    fingerprint,
    cooldownUntil: cooldownUntil ?? null
  })
}

/**
 * Loads gate state for a fingerprint.
 * @param fingerprint - Stable error fingerprint.
 * @returns The gate row, or `null` when missing.
 */
export async function getFingerprintGate(fingerprint: string): Promise<FingerprintGate | null> {
  return invoke<FingerprintGate | null>('get_fingerprint_gate', { fingerprint })
}

/**
 * Upserts a known-fingerprint cache entry.
 * @param entry - Cache write payload.
 */
export async function upsertKnownFingerprint(entry: KnownFingerprintWrite): Promise<void> {
  await invoke('upsert_known_fingerprint', { entry })
}

/**
 * Loads a known-fingerprint cache entry.
 * @param fingerprint - Stable error fingerprint.
 * @returns The cache entry, or `null` when missing.
 */
export async function getKnownFingerprint(fingerprint: string): Promise<KnownFingerprint | null> {
  return invoke<KnownFingerprint | null>('get_known_fingerprint', { fingerprint })
}

/**
 * Upserts a local feedback draft (not uploaded in this milestone).
 * @param draft - Draft write payload.
 */
export async function upsertFeedbackDraft(draft: FeedbackDraftWrite): Promise<void> {
  await invoke('upsert_feedback_draft', { draft })
}

/**
 * Loads one feedback draft by id.
 * @param id - Draft id.
 * @returns The draft, or `null` when missing.
 */
export async function getFeedbackDraft(id: string): Promise<FeedbackDraft | null> {
  return invoke<FeedbackDraft | null>('get_feedback_draft', { id })
}

/**
 * Lists feedback drafts by status (newest first).
 * @param status - Draft status filter.
 * @returns Matching drafts, newest first.
 */
export async function listFeedbackDraftsByStatus(
  status: FeedbackDraftStatus
): Promise<FeedbackDraft[]> {
  return invoke<FeedbackDraft[]>('list_feedback_drafts_by_status', { status })
}
