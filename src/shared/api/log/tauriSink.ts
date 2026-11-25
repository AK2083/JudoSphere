import { invoke } from '@tauri-apps/api/core'

import type { LogRecord, LogSink } from './types'

/**
 * Host-UI sink: forwards into the Tauri durable log (`forward_ui_log`).
 * No frontend-owned files or rotation.
 */
export class TauriSink implements LogSink {
  /**
   * Forwards a record to the host logging command.
   * @param record - Level, message, optional source.
   */
  async write(record: LogRecord): Promise<void> {
    await invoke('forward_ui_log', {
      level: record.level,
      message: record.message,
      source: record.source ?? null
    })
  }
}
