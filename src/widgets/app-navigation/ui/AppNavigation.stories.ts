import type { Meta, StoryObj } from '@storybook/vue3-vite'

import AppNavigation from './AppNavigation.vue'

const meta = {
  title: 'widgets/AppNavigation',
  component: AppNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    () => ({
      template: '<div style="display:flex;min-height:16rem;background:inherit"><story /></div>'
    })
  ]
} satisfies Meta<typeof AppNavigation>

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
