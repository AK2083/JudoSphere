/**
 * Forward-only client log types — level vocabulary lives in `config/logging.json`
 * via `@shared/config/logLevels`.
 */

export type { LogLevel } from '@shared/config'
export { LOG_LEVEL_ORDER } from '@shared/config'

/** One log line handed to a {@link LogSink}. */
export type LogRecord = {
  level: import('@shared/config').LogLevel
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
