import type { LogRecord, LogSink } from './types'

/**
 * Non-host sink for Vitest, Storybook, and LAN browsers (no durable host file).
 */
export class ConsoleSink implements LogSink {
  /**
   * Writes a record to the browser console.
   * @param record - Level, message, optional source.
   */
  write(record: LogRecord): void {
    const line = formatConsoleLine(record)
    switch (record.level) {
      case 'error':
        console.error(line)
        break
      case 'warn':
        console.warn(line)
        break
      case 'info':
        // eslint-disable-next-line no-console -- intentional console sink
        console.info(line)
        break
      case 'debug':
        // eslint-disable-next-line no-console -- intentional console sink
        console.debug(line)
        break
      case 'trace':
        // eslint-disable-next-line no-console -- intentional console sink
        console.debug(line)
        break
    }
  }
}

/**
 * Formats a console line with an optional source prefix.
 * @param record - Log record.
 * @returns Display string.
 */
export function formatConsoleLine(record: LogRecord): string {
  return record.source ? `[${record.source}] ${record.message}` : record.message
}
