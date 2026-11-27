import { sanitizeLogExtract } from '@shared/api'

/**
 * Sanitizes a log extract for feedback attach/preview via the host redact path.
 * @param raw - Unsanitized log text or JSON extract.
 * @returns Host-sanitized extract (never store the raw dump on the draft from Vue).
 */
export async function sanitizeAttachedLogExtract(raw: string): Promise<string> {
  return sanitizeLogExtract(raw)
}
