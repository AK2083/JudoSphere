/**
 * Forward-only client log types — level vocabulary lives in `config/logging.json`
 * via `@shared/config/logLevels`.
 */

export type { LogLevel } from '../../config/logLevels'
export { LOG_LEVEL_ORDER } from '../../config/logLevels'

/** One log line handed to a {@link LogSink}. */
export type LogRecord = {
  level: import('../../config/logLevels').LogLevel
  message: string
  source?: string
}

/**
 * Destination for facade output.
 * Host UI: typically {@link TauriSink}; Vitest / Storybook / LAN: {@link ConsoleSink}.
 */
export type LogSink = {
  write(record: LogRecord): void | Promise<void>
}
