import { isTauri } from '@tauri-apps/api/core'

/**
 * Resolves whether the current UI is the Tauri host shell.
 *
 * @param override - Explicit host flag for tests / callers.
 * @returns `true` when durable host logging may be claimed.
 */
export function resolveIsHostUi(override?: boolean): boolean {
  if (override !== undefined) {
    return override
  }
  return isTauri()
}

/**
 * Whether this UI owns the durable local host log file.
 * LAN / browser-only clients must never claim that file.
 *
 * @param isHostUi - Optional explicit host flag (defaults to {@link resolveIsHostUi}).
 * @returns `true` only for the host UI.
 */
export function ownsDurableHostLog(isHostUi?: boolean): boolean {
  return resolveIsHostUi(isHostUi)
}
