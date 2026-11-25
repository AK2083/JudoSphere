import { LOG_LEVEL_ORDER, type LogLevel, type LogRecord, type LogSink } from './types'

/**
 * Thin Vue / host-UI logging facade (future `@judosphere/log` npm package).
 * Call sites use this API only; durable storage stays on Tauri.
 */
export class Logger {
  #sink: LogSink
  #minLevel: LogLevel

  /**
   * @param sink - Destination (Tauri forward or console stub).
   * @param minLevel - Client gate; records more verbose than this are dropped.
   */
  constructor(sink: LogSink, minLevel: LogLevel = 'info') {
    this.#sink = sink
    this.#minLevel = minLevel
  }

  /**
   * Active sink.
   * @returns Current destination.
   */
  get sink(): LogSink {
    return this.#sink
  }

  /**
   * Active client-side minimum level.
   * @returns Current gate level.
   */
  get minLevel(): LogLevel {
    return this.#minLevel
  }

  /**
   * Replace the sink (e.g. ConsoleSink in tests).
   * @param sink - New destination.
   */
  setSink(sink: LogSink): void {
    this.#sink = sink
  }

  /**
   * Set the client-side level gate.
   * @param minLevel - Minimum level that is still emitted.
   */
  setMinLevel(minLevel: LogLevel): void {
    this.#minLevel = minLevel
  }

  /**
   * @param message - Log message.
   * @param source - Optional UI source hint.
   */
  error(message: string, source?: string): void {
    this.#emit('error', message, source)
  }

  /**
   * @param message - Log message.
   * @param source - Optional UI source hint.
   */
  warn(message: string, source?: string): void {
    this.#emit('warn', message, source)
  }

  /**
   * @param message - Log message.
   * @param source - Optional UI source hint.
   */
  info(message: string, source?: string): void {
    this.#emit('info', message, source)
  }

  /**
   * @param message - Log message.
   * @param source - Optional UI source hint.
   */
  debug(message: string, source?: string): void {
    this.#emit('debug', message, source)
  }

  /**
   * @param message - Log message.
   * @param source - Optional UI source hint.
   */
  trace(message: string, source?: string): void {
    this.#emit('trace', message, source)
  }

  #shouldEmit(level: LogLevel): boolean {
    return LOG_LEVEL_ORDER[level] <= LOG_LEVEL_ORDER[this.#minLevel]
  }

  #emit(level: LogLevel, message: string, source?: string): void {
    if (!this.#shouldEmit(level)) {
      return
    }
    const record: LogRecord = source === undefined ? { level, message } : { level, message, source }
    try {
      const result = this.#sink.write(record)
      if (result != null && typeof (result as Promise<void>).then === 'function') {
        void (result as Promise<void>).catch(() => undefined)
      }
    } catch {
      // Logging must never break the UI.
    }
  }
}
