import type { Meta, StoryObj } from '@storybook/vue3-vite'

import AppShell from './AppShell.vue'

const meta = {
  title: 'app/ui/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'todo'
    }
  }
} satisfies Meta<typeof AppShell>

export default meta
type Story = StoryObj<typeof meta>

/** Wide / desktop shell (sidebar navigation + expanded brand notch). */
export const Wide: Story = {
  globals: {
    locale: 'de',
    viewport: { value: 'desktop', isRotated: false }
  }
}

/** Narrow / mobile shell (top bar + collapsible brand notch). */
export const Narrow: Story = {
  globals: {
    locale: 'de',
    viewport: { value: 'mobile1', isRotated: false }
  }
}

/** English chrome labels on the wide layout. */
export const WideEnglish: Story = {
  globals: {
    locale: 'en',
    viewport: { value: 'desktop', isRotated: false }
  }
}

/** English chrome labels on the narrow layout. */
export const NarrowEnglish: Story = {
  globals: {
    locale: 'en',
    viewport: { value: 'mobile1', isRotated: false }
  }
}
