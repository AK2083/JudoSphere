import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildLogExcerptPayload } from './buildLogExcerptPayload'

describe('buildLogExcerptPayload', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-27T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('prefers a non-empty raw excerpt from the caller', () => {
    expect(
      buildLogExcerptPayload({
        fingerprint: 'fp-a',
        notes: 'ignored when raw present',
        rawExcerpt: '  {"lines":[1]}  '
      })
    ).toBe('{"lines":[1]}')
  })

  it('builds a structured JSON extract when no raw excerpt is provided', () => {
    const payload = buildLogExcerptPayload({
      fingerprint: 'fp-a',
      notes: 'assigning mats',
      rawExcerpt: '   '
    })

    expect(JSON.parse(payload)).toEqual({
      kind: 'judosphere.feedback-log-excerpt',
      fingerprint: 'fp-a',
      notes: 'assigning mats',
      attachedAt: '2026-11-27T12:00:00.000Z'
    })
  })

  it('allows a null fingerprint in the structured extract', () => {
    const payload = buildLogExcerptPayload({
      fingerprint: null,
      notes: ''
    })

    expect(JSON.parse(payload).fingerprint).toBeNull()
  })
})
