import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'

import Button from './Button.vue'

const meta = {
  title: 'shared/ui/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    backgroundColor: { control: 'color' }
  },
  args: {
    primary: false,
    onClick: fn()
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button'
  }
}

export const Secondary: Story = {
  args: {
    primary: false,
    label: 'Button'
  }
}

export const Large: Story = {
  args: {
    label: 'Button',
    size: 'large'
  }
}

export const Small: Story = {
  args: {
    label: 'Button',
    size: 'small'
  }
}
