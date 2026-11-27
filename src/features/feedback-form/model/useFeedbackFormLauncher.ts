import { computed, readonly, ref } from 'vue'

import type { KnownFingerprintStatus } from '@shared/api'

/** How the feedback form was requested. */
export type FeedbackFormOpenSource = 'status-bar' | 'recovery'

/** Context passed into the shared feedback form when opening an entry point. */
export type FeedbackFormOpenContext = {
  source: FeedbackFormOpenSource
  fingerprint?: string | null
  initialNotes?: string
  logExcerptRaw?: string | null
  knownStatusOverride?: KnownFingerprintStatus | null
}

const isOpen = ref(false)
const recoveryAvailable = ref(false)
const context = ref<FeedbackFormOpenContext>({ source: 'status-bar' })
const pendingRecoveryContext = ref<FeedbackFormOpenContext | null>(null)

/**
 * Resets launcher singleton state (tests / Storybook isolation).
 */
export function resetFeedbackFormLauncher(): void {
  isOpen.value = false
  recoveryAvailable.value = false
  context.value = { source: 'status-bar' }
  pendingRecoveryContext.value = null
}

/**
 * Opens the shared feedback form (status bar, recovery, or other callers).
 * Does not upload — callers only prepare a local draft through the form.
 * @param next - Open context; defaults to a status-bar entry with empty fields.
 */
export function openFeedbackForm(next: FeedbackFormOpenContext = { source: 'status-bar' }): void {
  context.value = {
    source: next.source,
    fingerprint: next.fingerprint ?? null,
    initialNotes: next.initialNotes ?? '',
    logExcerptRaw: next.logExcerptRaw ?? null,
    knownStatusOverride: next.knownStatusOverride
  }
  isOpen.value = true
}

/**
 * Closes the feedback form panel without discarding launcher recovery offers.
 */
export function closeFeedbackForm(): void {
  isOpen.value = false
}

/**
 * Marks that a crash / serious failure recovery path can offer the same feedback form.
 * @param next - Context to apply when the organizer opens feedback from the recovery offer.
 */
export function offerFeedbackAfterFailure(
  next: Omit<FeedbackFormOpenContext, 'source'> & { source?: FeedbackFormOpenSource } = {}
): void {
  pendingRecoveryContext.value = {
    source: 'recovery',
    fingerprint: next.fingerprint ?? null,
    initialNotes: next.initialNotes ?? '',
    logExcerptRaw: next.logExcerptRaw ?? null,
    knownStatusOverride: next.knownStatusOverride
  }
  recoveryAvailable.value = true
}

/**
 * Opens the shared feedback form using the pending recovery context.
 */
export function openFeedbackFormFromRecovery(): void {
  const pending = pendingRecoveryContext.value ?? { source: 'recovery' as const }
  openFeedbackForm({ ...pending, source: 'recovery' })
  recoveryAvailable.value = false
}

/**
 * Dismisses the recovery offer without opening the form.
 */
export function dismissFeedbackRecoveryOffer(): void {
  recoveryAvailable.value = false
  pendingRecoveryContext.value = null
}

/**
 * Shared launcher bindings for status-bar and recovery entry points.
 * @returns Readonly open/recovery state plus open/close/offer actions.
 */
export function useFeedbackFormLauncher() {
  return {
    isOpen: readonly(isOpen),
    recoveryAvailable: readonly(recoveryAvailable),
    context: readonly(context),
    panelTitleSource: computed(() => context.value.source),
    openFeedbackForm,
    closeFeedbackForm,
    offerFeedbackAfterFailure,
    openFeedbackFormFromRecovery,
    dismissFeedbackRecoveryOffer,
    resetFeedbackFormLauncher
  }
}
