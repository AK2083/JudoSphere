import { beforeEach, describe, expect, it, vi } from 'vitest'

const sanitizeLogExtract = vi.hoisted(() => vi.fn())

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>()
  return {
    ...actual,
    sanitizeLogExtract
  }
})

import { sanitizeAttachedLogExtract } from './sanitizeAttachedLogExtract'

describe('sanitizeAttachedLogExtract', () => {
  beforeEach(() => {
    sanitizeLogExtract.mockReset()
  })

  it('delegates to @shared/api sanitizeLogExtract', async () => {
    sanitizeLogExtract.mockResolvedValueOnce('{"ok":true}')

    await expect(sanitizeAttachedLogExtract('{"pin":"1"}')).resolves.toBe('{"ok":true}')
    expect(sanitizeLogExtract).toHaveBeenCalledWith('{"pin":"1"}')
  })
})
