import { beforeEach, describe, expect, it, vi } from 'vitest'

const formatUnknownError = vi.hoisted(() => vi.fn())

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>()
  return {
    ...actual,
    formatUnknownError
  }
})

import { notifyFeedbackFailureRecovery } from './notifyFeedbackFailureRecovery'
import { resetFeedbackFormLauncher, useFeedbackFormLauncher } from './useFeedbackFormLauncher'

describe('notifyFeedbackFailureRecovery', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
    formatUnknownError.mockReset()
    formatUnknownError.mockReturnValue('Error: boom')
  })

  it('offers recovery with a sanitized local excerpt payload', () => {
    notifyFeedbackFailureRecovery(new Error('boom'), 'render function')

    const launcher = useFeedbackFormLauncher()
    expect(launcher.recoveryAvailable.value).toBe(true)
    expect(formatUnknownError).toHaveBeenCalled()

    const pendingOpen = () => {
      const { openFeedbackFormFromRecovery } = launcher
      openFeedbackFormFromRecovery()
      return launcher.context.value.logExcerptRaw
    }

    expect(JSON.parse(pendingOpen() ?? '{}')).toEqual({
      kind: 'judosphere.failure-recovery',
      message: 'Error: boom',
      info: 'render function'
    })
  })

  it('stores null info when Vue did not provide lifecycle details', () => {
    notifyFeedbackFailureRecovery('plain')
    useFeedbackFormLauncher().openFeedbackFormFromRecovery()

    expect(
      JSON.parse(useFeedbackFormLauncher().context.value.logExcerptRaw ?? '{}').info
    ).toBeNull()
  })
})
