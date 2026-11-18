import type { Meta, StoryObj } from '@storybook/vue3-vite'

import BrandNotch from './BrandNotch.vue'

const meta = {
  title: 'widgets/BrandNotch',
  component: BrandNotch,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    () => ({
      template: '<div style="position:relative;min-height:8rem;background:inherit"><story /></div>'
    })
  ]
} satisfies Meta<typeof BrandNotch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Narrow: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}
