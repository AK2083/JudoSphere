import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_LOG_LEVEL } from '../../config/logLevels'
import { ConsoleSink, formatConsoleLine } from './consoleSink'
import { createDefaultLogger } from './createDefaultLogger'
import { Logger } from './Logger'
import { TauriSink } from './tauriSink'
import type { LogRecord, LogSink } from './types'

const invokeMock = vi.hoisted(() => vi.fn())
const isTauriMock = vi.hoisted(() => vi.fn(() => false))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
  isTauri: isTauriMock
}))

function recordingSink(writes: LogRecord[]): LogSink {
  return {
    write(record) {
      writes.push(record)
    }
  }
}

describe('formatConsoleLine', () => {
  it('prefixes source when present', () => {
    expect(formatConsoleLine({ level: 'info', message: 'hi', source: 'App' })).toBe('[App] hi')
  })

  it('returns plain message without source', () => {
    expect(formatConsoleLine({ level: 'info', message: 'hi' })).toBe('hi')
  })
})

describe('ConsoleSink', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('routes each level to the matching console method', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const sink = new ConsoleSink()

    sink.write({ level: 'error', message: 'e', source: 'S' })
    sink.write({ level: 'warn', message: 'w' })
    sink.write({ level: 'info', message: 'i' })
    sink.write({ level: 'debug', message: 'd' })
    sink.write({ level: 'trace', message: 't' })

    expect(error).toHaveBeenCalledWith('[S] e')
    expect(warn).toHaveBeenCalledWith('w')
    expect(info).toHaveBeenCalledWith('i')
    expect(debug).toHaveBeenCalledWith('d')
    expect(debug).toHaveBeenCalledWith('t')
  })
})

describe('TauriSink', () => {
  afterEach(() => {
    invokeMock.mockReset()
  })

  it('invokes forward_ui_log with null source when omitted', async () => {
    invokeMock.mockResolvedValue(undefined)
    const sink = new TauriSink()
    await sink.write({ level: 'warn', message: 'hall' })
    expect(invokeMock).toHaveBeenCalledWith('forward_ui_log', {
      level: 'warn',
      message: 'hall',
      source: null
    })
  })

  it('forwards optional source', async () => {
    invokeMock.mockResolvedValue(undefined)
    const sink = new TauriSink()
    await sink.write({ level: 'error', message: 'boom', source: 'App.vue' })
    expect(invokeMock).toHaveBeenCalledWith('forward_ui_log', {
      level: 'error',
      message: 'boom',
      source: 'App.vue'
    })
  })
})

describe('Logger', () => {
  it('emits through the sink for allowed levels and exposes getters', () => {
    const writes: LogRecord[] = []
    const logger = new Logger(recordingSink(writes), 'info')
    expect(logger.minLevel).toBe('info')
    expect(logger.sink).toBeTypeOf('object')

    logger.error('e', 'src')
    logger.warn('w')
    logger.info('i')
    logger.debug('d')
    logger.trace('t')

    expect(writes).toEqual([
      { level: 'error', message: 'e', source: 'src' },
      { level: 'warn', message: 'w' },
      { level: 'info', message: 'i' }
    ])
  })

  it('setMinLevel and setSink change gating and destination', () => {
    const first: LogRecord[] = []
    const second: LogRecord[] = []
    const logger = new Logger(recordingSink(first), 'error')
    logger.info('dropped')
    expect(first).toEqual([])

    logger.setMinLevel('debug')
    logger.debug('kept')
    expect(first).toEqual([{ level: 'debug', message: 'kept' }])

    logger.setSink(recordingSink(second))
    logger.warn('moved')
    expect(second).toEqual([{ level: 'warn', message: 'moved' }])
  })

  it('swallows sync sink failures', () => {
    const sink: LogSink = {
      write() {
        throw new Error('sink down')
      }
    }
    const logger = new Logger(sink, 'trace')
    expect(() => logger.error('x')).not.toThrow()
  })

  it('swallows async sink rejections', async () => {
    const sink: LogSink = {
      write() {
        return Promise.reject(new Error('ipc fail'))
      }
    }
    const logger = new Logger(sink, 'trace')
    logger.warn('x')
    await Promise.resolve()
  })
})

describe('createDefaultLogger', () => {
  afterEach(() => {
    isTauriMock.mockReset()
    isTauriMock.mockReturnValue(false)
    invokeMock.mockReset()
  })

  it('uses ConsoleSink outside the host UI and env min level', () => {
    isTauriMock.mockReturnValue(false)
    const logger = createDefaultLogger({
      readEnv: () => 'warn'
    })
    expect(logger.sink).toBeInstanceOf(ConsoleSink)
    expect(logger.minLevel).toBe('warn')
  })

  it('falls back to JSON default when env is missing or invalid', () => {
    isTauriMock.mockReturnValue(false)
    expect(createDefaultLogger({ readEnv: () => undefined }).minLevel).toBe(DEFAULT_LOG_LEVEL)
    expect(createDefaultLogger({ readEnv: () => 'loud' }).minLevel).toBe(DEFAULT_LOG_LEVEL)
  })

  it('uses TauriSink on the host UI', () => {
    isTauriMock.mockReturnValue(true)
    const logger = createDefaultLogger({ readEnv: () => 'debug' })
    expect(logger.sink).toBeInstanceOf(TauriSink)
    expect(logger.minLevel).toBe('debug')
  })

  it('honors explicit overrides', () => {
    const writes: LogRecord[] = []
    const sink = recordingSink(writes)
    const logger = createDefaultLogger({
      sink,
      minLevel: 'warn',
      isHostUi: true,
      readEnv: () => 'trace'
    })
    expect(logger.sink).toBe(sink)
    expect(logger.minLevel).toBe('warn')
    logger.info('no')
    logger.warn('yes')
    expect(writes).toEqual([{ level: 'warn', message: 'yes' }])
  })

  it('uses isTauri when isHostUi is omitted', () => {
    isTauriMock.mockReturnValue(false)
    const logger = createDefaultLogger({ readEnv: () => 'info' })
    expect(isTauriMock).toHaveBeenCalled()
    expect(logger.sink).toBeInstanceOf(ConsoleSink)
  })

  it('reads import.meta.env when readEnv is omitted', () => {
    isTauriMock.mockReturnValue(false)
    const logger = createDefaultLogger()
    expect(['error', 'warn', 'info', 'debug', 'trace']).toContain(logger.minLevel)
  })
})
