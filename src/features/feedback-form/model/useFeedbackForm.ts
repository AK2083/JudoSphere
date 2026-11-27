import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import type { KnownFingerprint, KnownFingerprintStatus } from '@shared/api'

import { fetchKnownFingerprint } from '../api/fetchKnownFingerprint'
import {
  type KnownStatusDisplay,
  knownStatusLabelKey,
  resolveKnownStatusDisplay
} from './resolveKnownStatusDisplay'

/** Loader used by the form to read the local known-fingerprint cache. */
export type LoadKnownFingerprint = (fingerprint: string) => Promise<KnownFingerprint | null>

/**
 *
 */
export type UseFeedbackFormOptions = {
  /** Linked error fingerprint; when empty, known-status shows the “none” copy. */
  fingerprint?: MaybeRefOrGetter<string | null | undefined>
  /** Initial notes text. */
  initialNotes?: string
  /**
   * When `true`, skip the host read and use `knownStatusOverride` (including `null` → new).
   * Useful for Storybook and focused UI tests.
   */
  useKnownStatusOverride?: MaybeRefOrGetter<boolean>
  /** Cache status used when `useKnownStatusOverride` is true. */
  knownStatusOverride?: MaybeRefOrGetter<KnownFingerprintStatus | null | undefined>
  /** Optional loader override (defaults to the feature `api/` wrapper). */
  loadKnownFingerprint?: LoadKnownFingerprint
}

/**
 * Feedback form state: free-text notes plus plain-language known-status from the local cache.
 * Does not upload or persist drafts — that belongs to a later Task.
 * @param options - Fingerprint binding, optional override, and loader injection.
 * @returns Reactive notes, known-status display keys, load state, and setters.
 */
export function useFeedbackForm(options: UseFeedbackFormOptions = {}) {
  const notes = ref(options.initialNotes ?? '')
  const knownEntry = ref<KnownFingerprint | null>(null)
  const loadFailed = ref(false)
  const loadState = ref<'idle' | 'loading' | 'ready'>('idle')

  const load = options.loadKnownFingerprint ?? fetchKnownFingerprint

  const fingerprint = computed(() => {
    const value = toValue(options.fingerprint)
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

  function setNotes(value: string): void {
    notes.value = value
  }

  watch(
    [fingerprint, usingOverride, overrideStatus],
    () => {
      void refreshKnownStatus()
    },
    { immediate: true }
  )

  return {
    notes,
    fingerprint,
    knownEntry,
    knownDisplay,
    knownStatusMessageKey,
    loadState,
    loadFailed,
    refreshKnownStatus,
    setNotes
  }
}
