import { getKnownFingerprint, type KnownFingerprint } from '@shared/api'

/**
 * Loads one known-fingerprint cache row for the feedback form.
 * Vue must not call Tauri `invoke` directly — go through `@shared/api`.
 * @param fingerprint - Stable error fingerprint from the host preprocess path.
 * @returns Cache row when present, otherwise `null` (treated as new locally).
 */
export async function fetchKnownFingerprint(fingerprint: string): Promise<KnownFingerprint | null> {
  return getKnownFingerprint(fingerprint)
}
