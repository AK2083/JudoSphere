import type { Meta, StoryObj } from '@storybook/vue3-vite'

import AppNavigation from './AppNavigation.vue'

const meta = {
  title: 'widgets/AppNavigation',
  component: AppNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    () => ({
      template: '<div style="display:flex;min-height:16rem;background:inherit"><story /></div>'
    })
  ]
} satisfies Meta<typeof AppNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const Wide: Story = {
  globals: {
    locale: 'de',
    viewport: { value: 'desktop', isRotated: false }
  }
}

export const Narrow: Story = {
  globals: {
    locale: 'de',
    viewport: { value: 'mobile1', isRotated: false }
  }
}

export const WideEnglish: Story = {
  globals: {
    locale: 'en',
    viewport: { value: 'desktop', isRotated: false }
  }
}
