import { describe, expect, it, vi } from 'vitest'

import type { ErrorForwardLogger } from './installUnhandledErrorForwarding'
import {
  createVueErrorCapturedHandler,
  installVueErrorForwarding,
  vueErrorSource
} from './installVueErrorForwarding'

describe('vueErrorSource', () => {
  it('labels handler and boundary bases', () => {
    expect(vueErrorSource('handler')).toBe('vue:errorHandler')
    expect(vueErrorSource('boundary')).toBe('vue:errorBoundary')
  })

  it('appends trimmed info when present', () => {
    expect(vueErrorSource('handler', '  render  ')).toBe('vue:errorHandler:render')
    expect(vueErrorSource('boundary', 'setup function')).toBe('vue:errorBoundary:setup function')
  })

  it('ignores blank info', () => {
    expect(vueErrorSource('handler', '   ')).toBe('vue:errorHandler')
    expect(vueErrorSource('boundary', undefined)).toBe('vue:errorBoundary')
  })
})

describe('installVueErrorForwarding', () => {
  it('sets errorHandler to forward via the logging facade', () => {
    const error = vi.fn()
    const log: ErrorForwardLogger = { error }
    const app = { config: { errorHandler: undefined as unknown } }

    installVueErrorForwarding(app as never, { logger: log, isHostUi: true })

    const boom = new Error('vue boom')
    boom.stack = 'Error: vue boom'
    const handler = app.config.errorHandler as (err: unknown, instance: null, info: string) => void
    handler(boom, null, 'render')

    expect(error).toHaveBeenCalledWith('Error: vue boom', 'vue:errorHandler:render')
  })

  it('uses the shared logger when no override is provided', () => {
    const app = { config: { errorHandler: undefined as unknown } }
    expect(() => installVueErrorForwarding(app as never, { isHostUi: true })).not.toThrow()
    expect(typeof app.config.errorHandler).toBe('function')
  })

  it('does not install on non-host UI', () => {
    const app = { config: { errorHandler: undefined as unknown } }
    installVueErrorForwarding(app as never, { isHostUi: false })
    expect(app.config.errorHandler).toBeUndefined()
  })

  it('does not log Vue instance props or secrets', () => {
    const error = vi.fn()
    const app = { config: { errorHandler: undefined as unknown } }
    installVueErrorForwarding(app as never, { logger: { error }, isHostUi: true })
    const handler = app.config.errorHandler as (
      err: unknown,
      instance: object,
      info: string
    ) => void
    handler(new Error('boom'), { $props: { pin: '1234', token: 'secret-token' } }, 'render')
    const [message, source] = error.mock.calls[0] as [string, string]
    expect(message).not.toContain('1234')
    expect(message).not.toContain('secret-token')
    expect(source).toBe('vue:errorHandler:render')
  })
})

describe('createVueErrorCapturedHandler', () => {
  it('forwards captured errors and returns false to stop propagation', () => {
    const error = vi.fn()
    const log: ErrorForwardLogger = { error }
    const handler = createVueErrorCapturedHandler({ logger: log, isHostUi: true })

    const result = handler('boundary fail', null, 'setup function')

    expect(result).toBe(false)
    expect(error).toHaveBeenCalledWith('boundary fail', 'vue:errorBoundary:setup function')
  })

  it('uses the shared logger when no override is provided', () => {
    const handler = createVueErrorCapturedHandler({ isHostUi: true })
    expect(handler(new Error('x'), null, '')).toBe(false)
  })

  it('is a no-op logger on non-host UI', () => {
    const error = vi.fn()
    const handler = createVueErrorCapturedHandler({ logger: { error }, isHostUi: false })
    expect(handler(new Error('x'), null, 'render')).toBe(false)
    expect(error).not.toHaveBeenCalled()
  })
})
