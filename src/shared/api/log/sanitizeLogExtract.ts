import { invoke } from '@tauri-apps/api/core'

/**
 * Returns a host-sanitized log extract for UI display or feedback attach.
 * Vue must not reimplement redact rules — the Tauri `sanitize_log_extract` command owns them.
 * @param raw - Unsanitized log text or JSON extract.
 * @returns Sanitized extract safe to show or attach (host may sanitize again on draft persist).
 */
export async function sanitizeLogExtract(raw: string): Promise<string> {
  return invoke<string>('sanitize_log_extract', { raw })
}
