import type { Meta, StoryObj } from '@storybook/vue3-vite'

import AppShell from './AppShell.vue'

const meta = {
  title: 'app/ui/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof AppShell>

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
