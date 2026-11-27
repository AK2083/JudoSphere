import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'

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
  args: {},
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: feedbackFormEn.title })).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent(feedbackFormEn.knownStatusNone)
  }
}

/** Known-status from the local cache shown in plain language. */
export const KnownStatus: Story = {
  args: {
    fingerprint: 'fp-demo-known',
    knownStatusOverride: 'known',
    initialNotes: 'Scoreboard froze while updating the pool sheet.'
  },
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent(feedbackFormEn.knownStatusKnown)
  }
}

/** German chrome for the known-status state. */
export const KnownStatusGerman: Story = {
  args: {
    fingerprint: 'fp-demo-known',
    knownStatusOverride: 'in_progress'
  },
  globals: {
    locale: LanguageCode.DE,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: feedbackFormDe.title })).toBeInTheDocument()
    await expect(canvas.getByRole('status')).toHaveTextContent(feedbackFormDe.knownStatusInProgress)
  }
}
