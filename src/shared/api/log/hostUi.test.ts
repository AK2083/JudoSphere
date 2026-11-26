import { afterEach, describe, expect, it, vi } from 'vitest'

import { ownsDurableHostLog, resolveIsHostUi } from './hostUi'

const isTauriMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: isTauriMock,
  invoke: vi.fn()
}))

describe('resolveIsHostUi / ownsDurableHostLog', () => {
  afterEach(() => {
    isTauriMock.mockReset()
    isTauriMock.mockReturnValue(false)
  })

  it('honors explicit overrides without calling isTauri', () => {
    expect(resolveIsHostUi(true)).toBe(true)
    expect(resolveIsHostUi(false)).toBe(false)
    expect(isTauriMock).not.toHaveBeenCalled()
  })

  it('delegates to isTauri when override is omitted', () => {
    isTauriMock.mockReturnValue(true)
    expect(resolveIsHostUi()).toBe(true)
    expect(isTauriMock).toHaveBeenCalled()

    isTauriMock.mockReturnValue(false)
    expect(resolveIsHostUi()).toBe(false)
  })

  it('ownsDurableHostLog is true only for the host UI', () => {
    expect(ownsDurableHostLog(true)).toBe(true)
    expect(ownsDurableHostLog(false)).toBe(false)
    isTauriMock.mockReturnValue(false)
    expect(ownsDurableHostLog()).toBe(false)
  })
})
