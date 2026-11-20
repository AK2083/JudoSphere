import type { Meta, StoryObj } from '@storybook/vue3-vite'

import BrandNotch from './BrandNotch.vue'

const meta = {
  title: 'widgets/BrandNotch',
  component: BrandNotch,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    () => ({
      template: '<div style="position:relative;min-height:8rem;background:inherit"><story /></div>'
    })
  ]
} satisfies Meta<typeof BrandNotch>

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
