import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sanitizeLogExtract } from './sanitizeLogExtract'

const invokeMock = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock
}))

describe('sanitizeLogExtract', () => {
  beforeEach(() => {
    invokeMock.mockReset()
  })

  it('invokes the host sanitize_log_extract command', async () => {
    invokeMock.mockResolvedValueOnce('{"pin":"[REDACTED]"}')

    await expect(sanitizeLogExtract('{"pin":"4242"}')).resolves.toBe('{"pin":"[REDACTED]"}')
    expect(invokeMock).toHaveBeenCalledWith('sanitize_log_extract', { raw: '{"pin":"4242"}' })
  })
})
