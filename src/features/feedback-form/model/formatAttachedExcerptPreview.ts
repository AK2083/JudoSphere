/** Max characters shown in the attachment status field for a sanitized extract. */
export const ATTACHED_EXCERPT_PREVIEW_MAX = 120

/**
 * Builds a single-line preview of a sanitized log extract for the attachment status field.
 * @param excerpt - Sanitized extract JSON/text.
 * @returns Truncated one-line preview, or an empty string when missing.
 */
export function formatAttachedExcerptPreview(excerpt: string | null | undefined): string {
  if (!excerpt) {
    return ''
  }
  const oneLine = excerpt.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= ATTACHED_EXCERPT_PREVIEW_MAX) {
    return oneLine
  }
  return `${oneLine.slice(0, ATTACHED_EXCERPT_PREVIEW_MAX - 1)}…`
}
