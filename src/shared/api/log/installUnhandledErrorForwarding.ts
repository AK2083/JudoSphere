import { logger } from './createDefaultLogger'
import type { Logger } from './Logger'

/** Minimal logger surface used by the installer (tests can pass a stub). */
export type ErrorForwardLogger = Pick<Logger, 'error'>

/**
 * Minimal event-target surface for installing window-level listeners
 * (avoids DOM overload incompatibilities with test stubs).
 */
export type UnhandledErrorEventTarget = {
  addEventListener: (type: string, listener: (event: Event) => void) => void
  removeEventListener: (type: string, listener: (event: Event) => void) => void
}

/** Options for {@link installUnhandledErrorForwarding}. */
export type InstallUnhandledErrorForwardingOptions = {
  /** Logger to forward into; defaults to the shared {@link logger}. */
  logger?: ErrorForwardLogger
  /**
   * Event target that receives `error` / `unhandledrejection`
   * (defaults to `globalThis`).
   */
  target?: UnhandledErrorEventTarget
}

const SOURCE_ERROR = 'unhandled-error'
const SOURCE_REJECTION = 'unhandled-rejection'

/**
 * Formats an unknown thrown value / rejection reason for the host log.
 *
 * @param error - Thrown value or rejection reason.
 * @returns Stable, single-line-friendly message (stack preferred for `Error`).
 */
export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack?.trim()
    if (stack) {
      return stack
    }
    return `${error.name}: ${error.message}`
  }
  if (typeof error === 'string') {
    return error
  }
  if (error === undefined) {
    return 'Unhandled rejection'
  }
  try {
    return String(error)
  } catch {
    return 'Unknown error'
  }
}

/**
 * Formats a window `ErrorEvent` for the host log.
 *
 * @param event - Browser error event.
 * @returns Message including location when the `error` object is absent.
 */
export function formatErrorEvent(event: ErrorEvent): string {
  if (event.error != null) {
    return formatUnknownError(event.error)
  }
  const base = event.message.trim() || 'Unhandled error'
  const parts: string[] = []
  if (event.filename) {
    parts.push(event.filename)
  }
  if (event.lineno > 0) {
    parts.push(String(event.lineno))
  }
  if (event.colno > 0) {
    parts.push(String(event.colno))
  }
  if (parts.length === 0) {
    return base
  }
  return `${base} (${parts.join(':')})`
}

/**
 * Installs `error` + `unhandledrejection` listeners that forward into the
 * Vue `@shared/api` logging facade (Tauri sink on host UI).
 *
 * @param options - Optional logger / target overrides (tests).
 * @returns Disposer that removes both listeners.
 */
export function installUnhandledErrorForwarding(
  options: InstallUnhandledErrorForwardingOptions = {}
): () => void {
  const log = options.logger ?? logger
  const target = options.target ?? globalThis

  const onError = (event: Event): void => {
    if (event instanceof ErrorEvent) {
      log.error(formatErrorEvent(event), SOURCE_ERROR)
      return
    }
    log.error('Unhandled error event', SOURCE_ERROR)
  }

  const onRejection = (event: Event): void => {
    const reason =
      typeof event === 'object' && event !== null && 'reason' in event
        ? (event as PromiseRejectionEvent).reason
        : undefined
    log.error(formatUnknownError(reason), SOURCE_REJECTION)
  }

  target.addEventListener('error', onError)
  target.addEventListener('unhandledrejection', onRejection)

  return () => {
    target.removeEventListener('error', onError)
    target.removeEventListener('unhandledrejection', onRejection)
  }
}
