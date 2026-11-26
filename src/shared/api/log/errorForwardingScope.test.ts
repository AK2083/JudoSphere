import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConsoleSink } from './consoleSink'
import { createDefaultLogger } from './createDefaultLogger'
import { ownsDurableHostLog } from './hostUi'
import { installUnhandledErrorForwarding } from './installUnhandledErrorForwarding'
import { installVueErrorForwarding } from './installVueErrorForwarding'
import { TauriSink } from './tauriSink'

const invokeMock = vi.hoisted(() => vi.fn())
const isTauriMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
  isTauri: isTauriMock
}))

function createTarget() {
  const listeners = new Map<string, Set<(event: Event) => void>>()
  return {
    addEventListener(type: string, listener: (event: Event) => void) {
      const set = listeners.get(type) ?? new Set()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener)
    },
    dispatch(type: string, event: Event) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event)
      }
    }
  }
}

describe('error forwarding host vs LAN scope', () => {
  afterEach(() => {
    invokeMock.mockReset()
    isTauriMock.mockReset()
    isTauriMock.mockReturnValue(false)
    vi.restoreAllMocks()
  })

  it('host UI: capture → facade → Tauri forward_ui_log', async () => {
    isTauriMock.mockReturnValue(true)
    invokeMock.mockResolvedValue(undefined)
    const hostLogger = createDefaultLogger({ isHostUi: true, minLevel: 'error' })
    expect(hostLogger.sink).toBeInstanceOf(TauriSink)
    expect(ownsDurableHostLog(true)).toBe(true)

    const target = createTarget()
    installUnhandledErrorForwarding({ logger: hostLogger, target, isHostUi: true })

    const boom = new Error('host fail')
    boom.stack = 'Error: host fail'
    target.dispatch('error', new ErrorEvent('error', { error: boom }))
    await Promise.resolve()

    expect(invokeMock).toHaveBeenCalledWith('forward_ui_log', {
      level: 'error',
      message: 'Error: host fail',
      source: 'unhandled-error'
    })
  })

  it('LAN / non-host: ConsoleSink only, never claims host log via invoke', async () => {
    isTauriMock.mockReturnValue(false)
    const lanLogger = createDefaultLogger({ isHostUi: false, minLevel: 'error' })
    expect(lanLogger.sink).toBeInstanceOf(ConsoleSink)
    expect(ownsDurableHostLog(false)).toBe(false)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const target = createTarget()
    installUnhandledErrorForwarding({ logger: lanLogger, target, isHostUi: false })

    target.dispatch(
      'error',
      new ErrorEvent('error', { error: new Error('lan noise'), message: 'lan noise' })
    )
    await Promise.resolve()

    expect(invokeMock).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()

    // Even if a caller forces a LAN logger write, durable host IPC stays unused.
    lanLogger.error('manual')
    await Promise.resolve()
    expect(invokeMock).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalled()
  })

  it('host Vue errorHandler reaches Tauri without dumping instance secrets', async () => {
    isTauriMock.mockReturnValue(true)
    invokeMock.mockResolvedValue(undefined)
    const hostLogger = createDefaultLogger({ isHostUi: true, minLevel: 'error' })
    const app = { config: { errorHandler: undefined as unknown } }
    installVueErrorForwarding(app as never, { logger: hostLogger, isHostUi: true })

    const handler = app.config.errorHandler as (
      err: unknown,
      instance: object,
      info: string
    ) => void
    handler(new Error('vue host'), { $props: { pin: '9999', accessToken: 'tok' } }, 'render')
    await Promise.resolve()

    expect(invokeMock).toHaveBeenCalledWith(
      'forward_ui_log',
      expect.objectContaining({
        level: 'error',
        source: 'vue:errorHandler:render'
      })
    )
    const payload = invokeMock.mock.calls[0]?.[1] as { message: string }
    expect(payload.message).not.toContain('9999')
    expect(payload.message).not.toContain('tok')
  })
})
