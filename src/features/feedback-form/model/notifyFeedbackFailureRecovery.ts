import { formatUnknownError } from '@shared/api'

import { offerFeedbackAfterFailure } from './useFeedbackFormLauncher'

/**
 * Offers the shared feedback form after a crash / serious failure was observed.
 * Builds a local log-excerpt payload; does not upload anything.
 * @param err - Captured error value.
 * @param info - Optional Vue lifecycle / render info.
 */
export function notifyFeedbackFailureRecovery(err: unknown, info?: string): void {
  offerFeedbackAfterFailure({
    logExcerptRaw: JSON.stringify({
      kind: 'judosphere.failure-recovery',
      message: formatUnknownError(err),
      info: info ?? null
    })
  })
}
