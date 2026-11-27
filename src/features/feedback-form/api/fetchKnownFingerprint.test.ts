import { beforeEach, describe, expect, it, vi } from 'vitest'

const getKnownFingerprint = vi.hoisted(() => vi.fn())

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>()
  return {
    ...actual,
    getKnownFingerprint
  }
})

import { fetchKnownFingerprint } from './fetchKnownFingerprint'

describe('fetchKnownFingerprint', () => {
  beforeEach(() => {
    getKnownFingerprint.mockReset()
  })

  it('delegates to @shared/api getKnownFingerprint', async () => {
    const row = {
      fingerprint: 'fp-1',
      status: 'known' as const,
      remoteRef: null,
      notes: null,
      createdAt: 't0',
      updatedAt: 't1'
    }
    getKnownFingerprint.mockResolvedValueOnce(row)

    await expect(fetchKnownFingerprint('fp-1')).resolves.toEqual(row)
    expect(getKnownFingerprint).toHaveBeenCalledWith('fp-1')
  })

  it('returns null when the cache has no row', async () => {
    getKnownFingerprint.mockResolvedValueOnce(null)

    await expect(fetchKnownFingerprint('missing')).resolves.toBeNull()
  })
})
