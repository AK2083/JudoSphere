import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'

import { LanguageCode } from '@shared/lib'

import { feedbackFormDe, feedbackFormEn } from '../i18n'
import FeedbackForm from './FeedbackForm.vue'

const meta = {
  title: 'features/feedback-form/FeedbackForm',
  component: FeedbackForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    () => ({
      template:
        '<div style="box-sizing:border-box;min-height:100%;width:100%;background:inherit"><story /></div>'
    })
  ]
} satisfies Meta<typeof FeedbackForm>

export default meta
type Story = StoryObj<typeof meta>

/** Default form with notes field and no linked fingerprint. */
export const Default: Story = {
  args: {
    knownStatusOverride: null
  },
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: feedbackFormEn.title })).toBeInTheDocument()
    await expect(canvas.getByText(feedbackFormEn.knownStatusNew)).toBeInTheDocument()
    await expect(canvas.getByTestId('feedback-form-attachment-status')).toHaveValue(
      feedbackFormEn.attachmentIdle
    )
  }
}

/** Known-status from the local cache shown in plain language. */
export const KnownStatus: Story = {
  args: {
    fingerprint: 'fp-demo-known',
    knownStatusOverride: 'known',
    initialNotes: 'Scoreboard froze while updating the pool sheet.',
    logExcerptRaw: '{"message":"pool sheet freeze","token":"should-redact"}'
  },
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(feedbackFormEn.knownStatusKnown)).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: feedbackFormEn.prepareAction })).toBeEnabled()
  }
}

/** German chrome for the known-status + attach affordances. */
export const KnownStatusGerman: Story = {
  args: {
    fingerprint: 'fp-demo-known',
    knownStatusOverride: 'in_progress',
    logExcerptRaw: '{"message":"court desk"}'
  },
  globals: {
    locale: LanguageCode.DE,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: feedbackFormDe.title })).toBeInTheDocument()
    await expect(canvas.getByText(feedbackFormDe.knownStatusInProgress)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: feedbackFormDe.attachAction }))
  }
}
