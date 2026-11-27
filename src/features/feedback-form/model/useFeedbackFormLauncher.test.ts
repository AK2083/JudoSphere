import { beforeEach, describe, expect, it } from 'vitest'

import {
  closeFeedbackForm,
  dismissFeedbackRecoveryOffer,
  offerFeedbackAfterFailure,
  openFeedbackForm,
  openFeedbackFormFromRecovery,
  resetFeedbackFormLauncher,
  useFeedbackFormLauncher
} from './useFeedbackFormLauncher'

describe('useFeedbackFormLauncher', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
  })

  it('opens from the status bar with empty local draft context', () => {
    openFeedbackForm({ source: 'status-bar' })
    const launcher = useFeedbackFormLauncher()

    expect(launcher.isOpen.value).toBe(true)
    expect(launcher.context.value).toMatchObject({
      source: 'status-bar',
      fingerprint: null,
      initialNotes: '',
      logExcerptRaw: null
    })
    expect(launcher.panelTitleSource.value).toBe('status-bar')
  })

  it('openFeedbackForm defaults to status-bar when called without args', () => {
    openFeedbackForm()
    expect(useFeedbackFormLauncher().context.value.source).toBe('status-bar')
  })

  it('closes the panel without clearing a recovery offer', () => {
    offerFeedbackAfterFailure({ logExcerptRaw: '{"m":"x"}' })
    openFeedbackForm({ source: 'status-bar' })
    closeFeedbackForm()

    const launcher = useFeedbackFormLauncher()
    expect(launcher.isOpen.value).toBe(false)
    expect(launcher.recoveryAvailable.value).toBe(true)
  })

  it('offers recovery context and opens the same form from recovery', () => {
    offerFeedbackAfterFailure({
      fingerprint: 'fp-r',
      initialNotes: 'after crash',
      logExcerptRaw: '{"kind":"failure"}'
    })

    const launcher = useFeedbackFormLauncher()
    expect(launcher.recoveryAvailable.value).toBe(true)

    openFeedbackFormFromRecovery()

    expect(launcher.isOpen.value).toBe(true)
    expect(launcher.recoveryAvailable.value).toBe(false)
    expect(launcher.context.value).toMatchObject({
      source: 'recovery',
      fingerprint: 'fp-r',
      initialNotes: 'after crash',
      logExcerptRaw: '{"kind":"failure"}'
    })
  })

  it('opens recovery with a default context when none was offered', () => {
    openFeedbackFormFromRecovery()
    expect(useFeedbackFormLauncher().context.value.source).toBe('recovery')
  })

  it('dismisses the recovery offer', () => {
    offerFeedbackAfterFailure({ fingerprint: 'fp-x' })
    dismissFeedbackRecoveryOffer()

    const launcher = useFeedbackFormLauncher()
    expect(launcher.recoveryAvailable.value).toBe(false)
    openFeedbackFormFromRecovery()
    expect(launcher.context.value.source).toBe('recovery')
    expect(launcher.context.value.fingerprint).toBeNull()
  })

  it('resetFeedbackFormLauncher clears open and recovery state', () => {
    offerFeedbackAfterFailure()
    openFeedbackForm({ source: 'recovery', fingerprint: 'fp' })
    resetFeedbackFormLauncher()

    const launcher = useFeedbackFormLauncher()
    expect(launcher.isOpen.value).toBe(false)
    expect(launcher.recoveryAvailable.value).toBe(false)
    expect(launcher.context.value.source).toBe('status-bar')
  })
})
