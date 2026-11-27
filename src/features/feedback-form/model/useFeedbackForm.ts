import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import type { KnownFingerprint, KnownFingerprintStatus } from '@shared/api'

import { fetchKnownFingerprint } from '../api/fetchKnownFingerprint'
import { sanitizeAttachedLogExtract } from '../api/sanitizeAttachedLogExtract'
import { saveFeedbackDraft, type SaveFeedbackDraftInput } from '../api/saveFeedbackDraft'
import { buildLogExcerptPayload } from './buildLogExcerptPayload'
import { clampFeedbackNotes, FEEDBACK_NOTES_MAX_LENGTH } from './notesLimits'
import {
  type KnownStatusDisplay,
  knownStatusLabelKey,
  resolveKnownStatusDisplay
} from './resolveKnownStatusDisplay'

export { FEEDBACK_NOTES_MAX_LENGTH } from './notesLimits'

/** Loader used by the form to read the local known-fingerprint cache. */
export type LoadKnownFingerprint = (fingerprint: string) => Promise<KnownFingerprint | null>

/** Sanitizer used before attach / draft persist. */
export type SanitizeLogExtractFn = (raw: string) => Promise<string>

/** Persister for local feedback drafts (no upload). */
export type SaveFeedbackDraftFn = (input: SaveFeedbackDraftInput) => Promise<void>

/** Visible outcome after an explicit prepare/save attempt. */
export type DraftSaveFeedback = 'idle' | 'saving' | 'success' | 'error'

/** How the sanitized attachment is currently represented in the form. */
export type AttachmentState = 'idle' | 'attaching' | 'attached' | 'error'

/** Why the last attach attempt failed (when `attachmentState` is `error`). */
export type AttachmentErrorReason = 'missing' | 'sanitize'

/**
 *
 */
export type UseFeedbackFormOptions = {
  /** Linked error fingerprint; when empty, known-status shows the “none” copy. */
  fingerprint?: MaybeRefOrGetter<string | null | undefined>
  /** Initial notes text. */
  initialNotes?: string
  /** Optional raw log extract from recovery / caller; sanitized before attach. */
  logExcerptRaw?: MaybeRefOrGetter<string | null | undefined>
  /**
   * When `true`, skip the host read and use `knownStatusOverride` (including `null` → new).
   * Useful for Storybook and focused UI tests.
   */
  useKnownStatusOverride?: MaybeRefOrGetter<boolean>
  /** Cache status used when `useKnownStatusOverride` is true. */
  knownStatusOverride?: MaybeRefOrGetter<KnownFingerprintStatus | null | undefined>
  /** Optional loader override (defaults to the feature `api/` wrapper). */
  loadKnownFingerprint?: LoadKnownFingerprint
  /** Optional sanitizer override (defaults to the feature `api/` wrapper). */
  sanitizeLogExtract?: SanitizeLogExtractFn
  /** Optional draft saver override (defaults to the feature `api/` wrapper). */
  saveFeedbackDraft?: SaveFeedbackDraftFn
  /** Optional id factory for new drafts (defaults to `crypto.randomUUID`). */
  createDraftId?: () => string
}

/**
 * Feedback form state: notes, known-status, sanitized log attach, and local draft save.
 * Explicit prepare/save only — no silent cloud upload.
 * @param options - Fingerprint binding, excerpt, overrides, and injectable host wrappers.
 * @returns Reactive form state, attachment/save feedback, and actions.
 */
export function useFeedbackForm(options: UseFeedbackFormOptions = {}) {
  const notes = ref(clampFeedbackNotes(options.initialNotes ?? ''))
  const knownEntry = ref<KnownFingerprint | null>(null)
  const loadFailed = ref(false)
  const loadState = ref<'idle' | 'loading' | 'ready'>('idle')

  const attachedExcerpt = ref<string | null>(null)
  const attachmentState = ref<AttachmentState>('idle')
  const attachmentErrorReason = ref<AttachmentErrorReason | null>(null)
  const draftSaveFeedback = ref<DraftSaveFeedback>('idle')
  const lastSavedDraftId = ref<string | null>(null)

  const load = options.loadKnownFingerprint ?? fetchKnownFingerprint
  const sanitize = options.sanitizeLogExtract ?? sanitizeAttachedLogExtract
  const persistDraft = options.saveFeedbackDraft ?? saveFeedbackDraft
  const createDraftId = options.createDraftId ?? (() => crypto.randomUUID())

  const fingerprint = computed(() => {
    const value = toValue(options.fingerprint)
    return value && value.length > 0 ? value : null
  })

  const logExcerptRaw = computed(() => {
    const value = toValue(options.logExcerptRaw)
    return value && value.length > 0 ? value : null
  })

  const usingOverride = computed(() => toValue(options.useKnownStatusOverride) === true)

  const overrideStatus = computed(() => {
    if (!usingOverride.value) {
      return undefined
    }
    return toValue(options.knownStatusOverride) ?? null
  })

  const knownDisplay = computed<KnownStatusDisplay>(() => {
    if (overrideStatus.value !== undefined) {
      return resolveKnownStatusDisplay(
        fingerprint.value ?? '__override__',
        overrideStatus.value,
        false
      )
    }
    return resolveKnownStatusDisplay(fingerprint.value, knownEntry.value?.status, loadFailed.value)
  })

  const knownStatusMessageKey = computed(() => knownStatusLabelKey(knownDisplay.value))

  const hasAttachment = computed(
    () => attachedExcerpt.value != null && attachedExcerpt.value.length > 0
  )

  const hasNotes = computed(() => notes.value.trim().length > 0)

  /** Save is allowed only when notes and a sanitized extract are both present. */
  const canPrepareSave = computed(() => hasNotes.value && hasAttachment.value)

  /**
   * Reloads known-status from the host (no-op when an override is active or fingerprint is missing).
   */
  async function refreshKnownStatus(): Promise<void> {
    if (usingOverride.value) {
      knownEntry.value = null
      loadFailed.value = false
      loadState.value = 'ready'
      return
    }

    const fp = fingerprint.value
    if (!fp) {
      knownEntry.value = null
      loadFailed.value = false
      loadState.value = 'ready'
      return
    }

    loadState.value = 'loading'
    loadFailed.value = false
    try {
      knownEntry.value = await load(fp)
      loadState.value = 'ready'
    } catch {
      knownEntry.value = null
      loadFailed.value = true
      loadState.value = 'ready'
    }
  }

  /**
   * Sanitizes the caller-supplied log extract and keeps it attached.
   * Fails when no raw extract is available — does not invent a placeholder payload.
   * @returns Sanitized excerpt when attach succeeds, otherwise `null`.
   */
  async function attachSanitizedLogExtract(): Promise<string | null> {
    const rawSource = logExcerptRaw.value
    if (!rawSource) {
      attachedExcerpt.value = null
      attachmentErrorReason.value = 'missing'
      attachmentState.value = 'error'
      return null
    }

    attachmentState.value = 'attaching'
    attachmentErrorReason.value = null
    try {
      const raw = buildLogExcerptPayload({
        fingerprint: fingerprint.value,
        notes: notes.value,
        rawExcerpt: rawSource
      })
      const sanitized = await sanitize(raw)
      attachedExcerpt.value = sanitized
      attachmentState.value = 'attached'
      return sanitized
    } catch {
      attachedExcerpt.value = null
      attachmentErrorReason.value = 'sanitize'
      attachmentState.value = 'error'
      return null
    }
  }

  /**
   * Explicit prepare/save: persist a local SQLite draft with notes + sanitized extract.
   * Never uploads to the cloud; does not invent a log extract during save.
   * @returns Saved draft id when successful, otherwise `null`.
   */
  async function prepareAndSaveDraft(): Promise<string | null> {
    if (!canPrepareSave.value) {
      return null
    }

    draftSaveFeedback.value = 'saving'

    const id = createDraftId()
    try {
      await persistDraft({
        id,
        notes: notes.value,
        fingerprint: fingerprint.value,
        logExcerptJson: attachedExcerpt.value,
        status: 'ready'
      })
      lastSavedDraftId.value = id
      draftSaveFeedback.value = 'success'
      return id
    } catch {
      draftSaveFeedback.value = 'error'
      return null
    }
  }

  function setNotes(value: string): void {
    notes.value = clampFeedbackNotes(value)
  }

  watch(
    [fingerprint, usingOverride, overrideStatus],
    () => {
      void refreshKnownStatus()
    },
    { immediate: true }
  )

  watch(
    logExcerptRaw,
    (raw) => {
      if (raw) {
        void attachSanitizedLogExtract()
      }
    },
    { immediate: true }
  )

  return {
    notes,
    notesMaxLength: FEEDBACK_NOTES_MAX_LENGTH,
    fingerprint,
    knownEntry,
    knownDisplay,
    knownStatusMessageKey,
    loadState,
    loadFailed,
    attachedExcerpt,
    attachmentState,
    attachmentErrorReason,
    hasAttachment,
    hasNotes,
    canPrepareSave,
    draftSaveFeedback,
    lastSavedDraftId,
    refreshKnownStatus,
    attachSanitizedLogExtract,
    prepareAndSaveDraft,
    setNotes
  }
}
