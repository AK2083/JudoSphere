import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetFeedbackFormLauncher, useFeedbackFormLauncher } from '@features/feedback-form'

vi.mock('./ui/AppShell.vue', () => ({
  default: defineComponent({
    name: 'AppShellStub',
    setup() {
      throw new Error('serious failure')
    },
    template: '<div data-testid="app-shell-stub" />'
  })
}))

const forward = vi.hoisted(() => vi.fn(() => false as const))

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>()
  return {
    ...actual,
    createVueErrorCapturedHandler: () => forward,
    formatUnknownError: (err: unknown) => String(err)
  }
})

import App from './App.vue'

describe('App', () => {
  beforeEach(() => {
    resetFeedbackFormLauncher()
    forward.mockClear()
  })

  it('forwards captured failures and offers the shared feedback recovery entry', async () => {
    const wrapper = mount(App, {
      global: {
        config: {
          warnHandler: () => undefined,
          errorHandler: () => undefined
        }
      }
    })

    await vi.waitFor(() => expect(useFeedbackFormLauncher().recoveryAvailable.value).toBe(true))
    expect(forward).toHaveBeenCalled()

    useFeedbackFormLauncher().openFeedbackFormFromRecovery()
    expect(useFeedbackFormLauncher().context.value.source).toBe('recovery')
    expect(useFeedbackFormLauncher().context.value.logExcerptRaw).toContain(
      'judosphere.failure-recovery'
    )

    wrapper.unmount()
  })
})
