/**
 * Vue forward-only logging facade (future `@judosphere/log` npm package entry).
 * Durable file logging stays on the Tauri host; this package only forwards / stubs.
 */

export { ConsoleSink, formatConsoleLine } from './consoleSink'
export { createDefaultLogger, type CreateDefaultLoggerOptions, logger } from './createDefaultLogger'
export {
  type ErrorForwardLogger,
  formatErrorEvent,
  formatUnknownError,
  installUnhandledErrorForwarding,
  type InstallUnhandledErrorForwardingOptions,
  type UnhandledErrorEventTarget
} from './installUnhandledErrorForwarding'
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
