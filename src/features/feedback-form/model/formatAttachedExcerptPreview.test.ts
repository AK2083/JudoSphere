import { describe, expect, it } from 'vitest'

import {
  ATTACHED_EXCERPT_PREVIEW_MAX,
  formatAttachedExcerptPreview
} from './formatAttachedExcerptPreview'

describe('formatAttachedExcerptPreview', () => {
  it('returns a compact one-line preview for short extracts', () => {
    expect(formatAttachedExcerptPreview(null)).toBe('')
    expect(formatAttachedExcerptPreview(undefined)).toBe('')
    expect(formatAttachedExcerptPreview('{"ok": true}')).toBe('{"ok": true}')
    expect(formatAttachedExcerptPreview('  line\none\ttwo  ')).toBe('line one two')
  })

  it('truncates long extracts with an ellipsis', () => {
    const raw = `{"payload":"${'x'.repeat(ATTACHED_EXCERPT_PREVIEW_MAX)}"}`
    const preview = formatAttachedExcerptPreview(raw)

    expect(preview).toHaveLength(ATTACHED_EXCERPT_PREVIEW_MAX)
    expect(preview.endsWith('…')).toBe(true)
  })
})
