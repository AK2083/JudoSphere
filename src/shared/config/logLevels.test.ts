import { describe, expect, it } from 'vitest'

import loggingJson from '@config/logging.json' with { type: 'json' }

import {
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL_ENV_VAR,
  LOG_LEVEL_ORDER,
  LOG_LEVELS,
  parseLogLevel,
  resolveLogLevelFromEnv
} from './logLevels'

describe('logLevels (config/logging.json)', () => {
  it('matches the JSON vocabulary and default', () => {
    expect([...LOG_LEVELS]).toEqual(loggingJson.levels)
    expect(LOG_LEVEL_ENV_VAR).toBe(loggingJson.envVar)
    expect(DEFAULT_LOG_LEVEL).toBe(loggingJson.defaultLevel)
    expect(LOG_LEVEL_ORDER.error).toBeLessThan(LOG_LEVEL_ORDER.trace)
  })

  it('parses known levels and warning alias', () => {
    expect(parseLogLevel(' ERROR ')).toBe('error')
    expect(parseLogLevel('warning')).toBe('warn')
    expect(parseLogLevel('nope')).toBeUndefined()
    expect(parseLogLevel(undefined)).toBeUndefined()
    expect(parseLogLevel(null)).toBeUndefined()
  })

  it('resolves from env reader then falls back to JSON default', () => {
    expect(resolveLogLevelFromEnv(() => 'debug')).toBe('debug')
    expect(resolveLogLevelFromEnv(() => 'loud')).toBe(DEFAULT_LOG_LEVEL)
    expect(resolveLogLevelFromEnv(() => undefined)).toBe(DEFAULT_LOG_LEVEL)
    expect(resolveLogLevelFromEnv((key) => (key === LOG_LEVEL_ENV_VAR ? 'trace' : undefined))).toBe(
      'trace'
    )
  })
})
