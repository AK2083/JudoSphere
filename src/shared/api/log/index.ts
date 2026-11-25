/**
 * Vue forward-only logging facade (future `@judosphere/log` npm package entry).
 * Durable file logging stays on the Tauri host; this package only forwards / stubs.
 */

export { ConsoleSink, formatConsoleLine } from './consoleSink'
export { createDefaultLogger, type CreateDefaultLoggerOptions } from './createDefaultLogger'
export { Logger } from './Logger'
export { TauriSink } from './tauriSink'
export { LOG_LEVEL_ORDER, type LogLevel, type LogRecord, type LogSink } from './types'
export {
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL_ENV_VAR,
  LOG_LEVELS,
  parseLogLevel,
  resolveLogLevelFromEnv
} from '@shared/config'

import { createDefaultLogger } from './createDefaultLogger'

/** Shared app logger — swap sink/level via {@link Logger.setSink} / {@link Logger.setMinLevel}. */
export const logger = createDefaultLogger()
