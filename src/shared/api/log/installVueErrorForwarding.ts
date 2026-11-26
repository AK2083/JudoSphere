import type { App, ComponentPublicInstance } from 'vue'

import { logger } from './createDefaultLogger'
import { resolveIsHostUi } from './hostUi'
import { type ErrorForwardLogger, formatUnknownError } from './installUnhandledErrorForwarding'

/** Options for Vue error forwarding helpers. */
export type InstallVueErrorForwardingOptions = {
  /** Logger to forward into; defaults to the shared {@link logger}. */
  logger?: ErrorForwardLogger
  /**
   * Host-UI gate. When false (LAN / browser-only), installation is a no-op —
   * non-host clients must not claim the durable host log file.
   */
  isHostUi?: boolean
}

/** `onErrorCaptured`-compatible handler returned by {@link createVueErrorCapturedHandler}. */
export type VueErrorCapturedHandler = (
  err: unknown,
  instance: ComponentPublicInstance | null,
  info: string
) => false

const SOURCE_HANDLER = 'vue:errorHandler'
const SOURCE_BOUNDARY = 'vue:errorBoundary'

/**
 * Builds a stable source label for Vue-forwarded errors.
 *
 * @param kind - Global handler vs error-boundary capture.
 * @param info - Vue lifecycle / render info string when present.
 * @returns Source hint for {@link Logger.error}.
 */
export function vueErrorSource(kind: 'handler' | 'boundary', info?: string): string {
  const base = kind === 'handler' ? SOURCE_HANDLER : SOURCE_BOUNDARY
  const trimmed = info?.trim()
  if (trimmed) {
    return `${base}:${trimmed}`
  }
  return base
}

/**
 * Installs Vue `app.config.errorHandler` so framework-caught errors forward
 * through the `@shared/api` logging facade (Tauri sink on host UI).
 *
 * @param app - Vue application (or a `config`-compatible stub in tests).
 * @param options - Optional logger / host-UI overrides.
 */
export function installVueErrorForwarding(
  app: Pick<App, 'config'>,
  options: InstallVueErrorForwardingOptions = {}
): void {
  if (!resolveIsHostUi(options.isHostUi)) {
    return
  }

  const log = options.logger ?? logger
  app.config.errorHandler = (err, instance, info) => {
    // By design: never serialize Vue instance props/state (tokens, PINs, PII).
    void instance
    log.error(formatUnknownError(err), vueErrorSource('handler', info))
  }
}

/**
 * Creates an `onErrorCaptured` handler that forwards into the same logging
 * facade, then stops further propagation (avoids double-logging with the
 * global errorHandler for the same error).
 *
 * @param options - Optional logger / host-UI overrides.
 * @returns Handler suitable for `onErrorCaptured(...)`.
 */
export function createVueErrorCapturedHandler(
  options: InstallVueErrorForwardingOptions = {}
): VueErrorCapturedHandler {
  if (!resolveIsHostUi(options.isHostUi)) {
    return () => false
  }

  const log = options.logger ?? logger
  return (err, instance, info) => {
    // By design: never serialize Vue instance props/state (tokens, PINs, PII).
    void instance
    log.error(formatUnknownError(err), vueErrorSource('boundary', info))
    return false
  }
}
