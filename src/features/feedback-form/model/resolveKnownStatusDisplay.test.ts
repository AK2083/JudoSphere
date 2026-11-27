import { describe, expect, it } from 'vitest'

import translationKeys from '../i18n/keys'
import { knownStatusLabelKey, resolveKnownStatusDisplay } from './resolveKnownStatusDisplay'

describe('resolveKnownStatusDisplay', () => {
  it('returns none when no fingerprint is linked', () => {
    expect(resolveKnownStatusDisplay(null, 'known')).toBe('none')
    expect(resolveKnownStatusDisplay('', 'known')).toBe('none')
    expect(resolveKnownStatusDisplay(undefined, null)).toBe('none')
  })

  it('returns error when the host read failed', () => {
    expect(resolveKnownStatusDisplay('fp', 'known', true)).toBe('error')
  })

  it('maps cache statuses and treats missing rows as new', () => {
    expect(resolveKnownStatusDisplay('fp', 'known')).toBe('known')
    expect(resolveKnownStatusDisplay('fp', 'in_progress')).toBe('in_progress')
    expect(resolveKnownStatusDisplay('fp', 'new')).toBe('new')
    expect(resolveKnownStatusDisplay('fp', null)).toBe('new')
    expect(resolveKnownStatusDisplay('fp', undefined)).toBe('new')
  })
})

describe('knownStatusLabelKey', () => {
  it('returns the matching i18n key for each display bucket', () => {
    expect(knownStatusLabelKey('none')).toBe(translationKeys.knownStatusNone)
    expect(knownStatusLabelKey('new')).toBe(translationKeys.knownStatusNew)
    expect(knownStatusLabelKey('known')).toBe(translationKeys.knownStatusKnown)
    expect(knownStatusLabelKey('in_progress')).toBe(translationKeys.knownStatusInProgress)
    expect(knownStatusLabelKey('error')).toBe(translationKeys.knownStatusLoadError)
  })
})
