import { isTauri } from '@tauri-apps/api/core'

import { type LogLevel, resolveLogLevelFromEnv } from '@shared/config'

import { ConsoleSink } from './consoleSink'
import { Logger } from './Logger'
import { TauriSink } from './tauriSink'
import type { LogSink } from './types'

/** Options for {@link createDefaultLogger}. */
export type CreateDefaultLoggerOptions = {
  /** Override sink selection (tests). */
  sink?: LogSink
  /** Override client gate (tests). */
  minLevel?: LogLevel
  /** Override host detection (tests). */
  isHostUi?: boolean
  /** Override env reader for the min level (tests). */
  readEnv?: (key: string) => string | undefined
}

function readViteLogLevelEnv(_key: string): string | undefined {
  return import.meta.env.LOG_LEVEL
}

/**
 * Builds a logger with host-aware sink and env-based min level
 * (`LOG_LEVEL` from `config/logging.json`).
 *
 * @param options - Optional overrides for tests.
 * @returns Configured {@link Logger}.
 */
export function createDefaultLogger(options: CreateDefaultLoggerOptions = {}): Logger {
  const isHostUi = options.isHostUi ?? isTauri()
  const sink = options.sink ?? (isHostUi ? new TauriSink() : new ConsoleSink())
  const minLevel =
    options.minLevel ?? resolveLogLevelFromEnv(options.readEnv ?? readViteLogLevelEnv)
  return new Logger(sink, minLevel)
}
