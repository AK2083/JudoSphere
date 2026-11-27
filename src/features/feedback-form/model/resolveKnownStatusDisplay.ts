import type { KnownFingerprintStatus } from '@shared/api'

import translationKeys from '../i18n/keys'

/** Plain-language known-status bucket shown in the feedback form. */
export type KnownStatusDisplay = 'none' | 'new' | 'known' | 'in_progress' | 'error'

/**
 * Maps fingerprint + cache status into a display bucket for plain-language copy.
 * Missing cache rows count as `new`. No fingerprint → `none`.
 * @param fingerprint - Linked fingerprint, if any.
 * @param status - Cache status when a row was loaded.
 * @param loadFailed - Whether the host read failed.
 * @returns Display bucket for i18n lookup.
 */
export function resolveKnownStatusDisplay(
  fingerprint: string | null | undefined,
  status: KnownFingerprintStatus | null | undefined,
  loadFailed = false
): KnownStatusDisplay {
  if (loadFailed) {
    return 'error'
  }
  if (!fingerprint) {
    return 'none'
  }
  if (status === 'known') {
    return 'known'
  }
  if (status === 'in_progress') {
    return 'in_progress'
  }
  return 'new'
}

/**
 * i18n key for a known-status display bucket.
 * @param display - Resolved display bucket.
 * @returns Full message key path for `useTranslation().t(...)`.
 */
export function knownStatusLabelKey(display: KnownStatusDisplay): string {
  switch (display) {
    case 'known':
      return translationKeys.knownStatusKnown
    case 'in_progress':
      return translationKeys.knownStatusInProgress
    case 'new':
      return translationKeys.knownStatusNew
    case 'error':
      return translationKeys.knownStatusLoadError
    case 'none':
      return translationKeys.knownStatusNone
  }
}
