import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'

import { LanguageCode } from '@shared/lib'

import { feedbackFormEn } from '../i18n'
import { openFeedbackForm, resetFeedbackFormLauncher } from '../model/useFeedbackFormLauncher'
import FeedbackFormPanel from './FeedbackFormPanel.vue'

const meta = {
  title: 'features/feedback-form/FeedbackFormPanel',
  component: FeedbackFormPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' }
  },
  decorators: [
    () => {
      resetFeedbackFormLauncher()
      openFeedbackForm({
        source: 'status-bar',
        knownStatusOverride: null,
        initialNotes: 'Opened from Storybook'
      })
      return {
        template: '<div style="min-height:100vh;background:inherit"><story /></div>'
      }
    }
  ]
} satisfies Meta<typeof FeedbackFormPanel>

export default meta
type Story = StoryObj<typeof meta>

export const OpenFromStatusBar: Story = {
  globals: { locale: LanguageCode.EN, viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByTestId('feedback-form-panel')).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: feedbackFormEn.title })).toBeInTheDocument()
  }
}

export const OpenFromRecovery: Story = {
  globals: { locale: LanguageCode.EN, viewport: { value: 'desktop', isRotated: false } },
  decorators: [
    () => {
      resetFeedbackFormLauncher()
      openFeedbackForm({
        source: 'recovery',
        fingerprint: 'fp-story',
        knownStatusOverride: 'known',
        logExcerptRaw: '{"message":"recovery"}'
      })
      return {
        template: '<div style="min-height:100vh;background:inherit"><story /></div>'
      }
    }
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(feedbackFormEn.knownStatusKnown)).toBeInTheDocument()
  }
}
