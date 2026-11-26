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

    installVueErrorForwarding(app as never, { logger: log })

    const boom = new Error('vue boom')
    boom.stack = 'Error: vue boom'
    const handler = app.config.errorHandler as (err: unknown, instance: null, info: string) => void
    handler(boom, null, 'render')

    expect(error).toHaveBeenCalledWith('Error: vue boom', 'vue:errorHandler:render')
  })

  it('uses the shared logger when no override is provided', () => {
    const app = { config: { errorHandler: undefined as unknown } }
    expect(() => installVueErrorForwarding(app as never)).not.toThrow()
    expect(typeof app.config.errorHandler).toBe('function')
  })
})

describe('createVueErrorCapturedHandler', () => {
  it('forwards captured errors and returns false to stop propagation', () => {
    const error = vi.fn()
    const log: ErrorForwardLogger = { error }
    const handler = createVueErrorCapturedHandler({ logger: log })

    const result = handler('boundary fail', null, 'setup function')

    expect(result).toBe(false)
    expect(error).toHaveBeenCalledWith('boundary fail', 'vue:errorBoundary:setup function')
  })

  it('uses the shared logger when no override is provided', () => {
    const handler = createVueErrorCapturedHandler()
    expect(handler(new Error('x'), null, '')).toBe(false)
  })
})
