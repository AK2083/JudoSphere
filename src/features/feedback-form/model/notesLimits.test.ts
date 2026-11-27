import { describe, expect, it } from 'vitest'

import { clampFeedbackNotes, FEEDBACK_NOTES_MAX_LENGTH } from './notesLimits'

describe('notesLimits', () => {
  it('leaves short notes unchanged', () => {
    expect(clampFeedbackNotes('mats')).toBe('mats')
  })

  it('truncates notes that exceed the maximum', () => {
    const raw = 'x'.repeat(FEEDBACK_NOTES_MAX_LENGTH + 25)
    const clamped = clampFeedbackNotes(raw)

    expect(clamped).toHaveLength(FEEDBACK_NOTES_MAX_LENGTH)
    expect(clamped).toBe('x'.repeat(FEEDBACK_NOTES_MAX_LENGTH))
  })
})
