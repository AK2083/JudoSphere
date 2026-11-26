import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  type ErrorForwardLogger,
  formatErrorEvent,
  formatUnknownError,
  installUnhandledErrorForwarding
} from './installUnhandledErrorForwarding'

type WindowEventHandler = (event: Event) => void

function createTarget() {
  const listeners = new Map<string, Set<WindowEventHandler>>()
  return {
    addEventListener(type: string, listener: WindowEventHandler) {
      const set = listeners.get(type) ?? new Set()
      set.add(listener)
      listeners.set(type, set)
    },
    removeEventListener(type: string, listener: WindowEventHandler) {
      listeners.get(type)?.delete(listener)
    },
    dispatch(type: string, event: Event) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event)
      }
    },
    listenerCount(type: string): number {
      return listeners.get(type)?.size ?? 0
    }
  }
}

describe('formatUnknownError', () => {
  it('prefers Error.stack when present', () => {
    const error = new Error('boom')
    error.stack = 'Error: boom\n    at test'
    expect(formatUnknownError(error)).toBe('Error: boom\n    at test')
  })

  it('falls back to name and message when stack is missing', () => {
    const error = new Error('boom')
    error.stack = '   '
    expect(formatUnknownError(error)).toBe('Error: boom')
  })

  it('returns strings as-is', () => {
    expect(formatUnknownError('plain')).toBe('plain')
  })

  it('labels undefined rejections', () => {
    expect(formatUnknownError(undefined)).toBe('Unhandled rejection')
  })

  it('stringifies other values', () => {
    expect(formatUnknownError(42)).toBe('42')
    expect(formatUnknownError(null)).toBe('null')
  })

  it('returns Unknown error when String() throws', () => {
    const evil = {
      toString(): string {
        throw new Error('nope')
      },
      valueOf(): string {
        throw new Error('nope')
      }
    }
    expect(formatUnknownError(evil)).toBe('Unknown error')
  })
})

describe('formatErrorEvent', () => {
  it('formats nested error objects', () => {
    const error = new Error('nested')
    error.stack = 'Error: nested'
    const event = new ErrorEvent('error', { error, message: 'ignored' })
    expect(formatErrorEvent(event)).toBe('Error: nested')
  })

  it('includes location when error object is absent', () => {
    const event = new ErrorEvent('error', {
      message: 'Script error.',
      filename: 'app.js',
      lineno: 10,
      colno: 4
    })
    expect(formatErrorEvent(event)).toBe('Script error. (app.js:10:4)')
  })

  it('omits empty location parts and blank messages', () => {
    const blank = new ErrorEvent('error', { message: '   ' })
    expect(formatErrorEvent(blank)).toBe('Unhandled error')

    const fileOnly = new ErrorEvent('error', {
      message: 'fail',
      filename: 'x.js',
      lineno: 0,
      colno: 0
    })
    expect(formatErrorEvent(fileOnly)).toBe('fail (x.js)')
  })
})

describe('installUnhandledErrorForwarding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('forwards ErrorEvent and non-ErrorEvent error events', () => {
    const error = vi.fn()
    const log: ErrorForwardLogger = { error }
    const target = createTarget()
    const dispose = installUnhandledErrorForwarding({ logger: log, target, isHostUi: true })

    const nested = new Error('crash')
    nested.stack = 'Error: crash'
    target.dispatch('error', new ErrorEvent('error', { error: nested }))
    target.dispatch('error', new Event('error'))

    expect(error).toHaveBeenCalledWith('Error: crash', 'unhandled-error')
    expect(error).toHaveBeenCalledWith('Unhandled error event', 'unhandled-error')
    dispose()
  })

  it('forwards unhandled rejections with and without reason', () => {
    const error = vi.fn()
    const log: ErrorForwardLogger = { error }
    const target = createTarget()
    installUnhandledErrorForwarding({ logger: log, target, isHostUi: true })

    const rejection = new Event('unhandledrejection') as Event & { reason: unknown }
    rejection.reason = 'nope'
    target.dispatch('unhandledrejection', rejection)
    target.dispatch('unhandledrejection', new Event('unhandledrejection'))

    expect(error).toHaveBeenCalledWith('nope', 'unhandled-rejection')
    expect(error).toHaveBeenCalledWith('Unhandled rejection', 'unhandled-rejection')
  })

  it('removes listeners on dispose and defaults to shared logger + globalThis', () => {
    const target = createTarget()
    const dispose = installUnhandledErrorForwarding({
      logger: { error: vi.fn() },
      target,
      isHostUi: true
    })
    expect(target.listenerCount('error')).toBe(1)
    expect(target.listenerCount('unhandledrejection')).toBe(1)
    dispose()
    expect(target.listenerCount('error')).toBe(0)
    expect(target.listenerCount('unhandledrejection')).toBe(0)

    const spy = vi.spyOn(globalThis, 'addEventListener')
    const removeSpy = vi.spyOn(globalThis, 'removeEventListener')
    const uninstall = installUnhandledErrorForwarding({ isHostUi: true })
    expect(spy).toHaveBeenCalledWith('error', expect.any(Function))
    expect(spy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
    uninstall()
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
  })

  it('is a no-op on non-host UI (LAN / browser-only)', () => {
    const error = vi.fn()
    const target = createTarget()
    const dispose = installUnhandledErrorForwarding({
      logger: { error },
      target,
      isHostUi: false
    })
    expect(target.listenerCount('error')).toBe(0)
    target.dispatch('error', new ErrorEvent('error', { message: 'x' }))
    expect(error).not.toHaveBeenCalled()
    dispose()
  })
})
