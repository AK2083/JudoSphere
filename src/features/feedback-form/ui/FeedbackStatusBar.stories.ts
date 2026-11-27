import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'

import { LanguageCode } from '@shared/lib'

import { feedbackFormEn } from '../i18n'
import {
  offerFeedbackAfterFailure,
  resetFeedbackFormLauncher
} from '../model/useFeedbackFormLauncher'
import FeedbackStatusBar from './FeedbackStatusBar.vue'

const meta = {
  title: 'features/feedback-form/FeedbackStatusBar',
  component: FeedbackStatusBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' }
  },
  decorators: [
    () => {
      resetFeedbackFormLauncher()
      return {
        template:
          '<div style="min-height:3rem;display:flex;border-top:1px solid #ccc;background:#fff"><story /></div>'
      }
    }
  ]
} satisfies Meta<typeof FeedbackStatusBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  globals: { locale: LanguageCode.EN, viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: feedbackFormEn.statusBarOpen })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: feedbackFormEn.statusBarOpen }))
  }
}

export const RecoveryOffer: Story = {
  globals: { locale: LanguageCode.EN, viewport: { value: 'desktop', isRotated: false } },
  decorators: [
    () => {
      resetFeedbackFormLauncher()
      offerFeedbackAfterFailure({ logExcerptRaw: '{"message":"serious failure"}' })
      return {
        template:
          '<div style="min-height:3rem;display:flex;border-top:1px solid #ccc;background:#fff"><story /></div>'
      }
    }
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('feedback-recovery-offer')).toBeInTheDocument()
    await userEvent.click(canvas.getByTestId('feedback-recovery-open'))
  }
}
