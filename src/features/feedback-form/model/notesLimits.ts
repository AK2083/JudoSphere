/** Maximum length for feedback draft notes (characters). */
export const FEEDBACK_NOTES_MAX_LENGTH = 1000

/**
 * Clamps notes to the allowed maximum length.
 * @param value - Raw notes input.
 * @returns Notes truncated to {@link FEEDBACK_NOTES_MAX_LENGTH}.
 */
export function clampFeedbackNotes(value: string): string {
  if (value.length <= FEEDBACK_NOTES_MAX_LENGTH) {
    return value
  }
  return value.slice(0, FEEDBACK_NOTES_MAX_LENGTH)
}
