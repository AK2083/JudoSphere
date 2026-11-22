import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'

import { APP_PREFERENCES_STORAGE_KEY, LanguageCode, ThemePreference } from '@shared/lib'

import SettingsPage from './SettingsPage.vue'

function seedPreferences(language: string, theme: ThemePreference = ThemePreference.System): void {
  localStorage.setItem(
    APP_PREFERENCES_STORAGE_KEY,
    JSON.stringify({
      theme,
      language: language === LanguageCode.DE ? LanguageCode.DE : LanguageCode.EN
    })
  )
  document.documentElement.removeAttribute('data-color-scheme')
}

const meta = {
  title: 'pages/SettingsPage',
  component: SettingsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: {
      test: 'todo'
    }
  },
  decorators: [
    (_story, context) => {
      const locale = (context.globals.locale as string | undefined) ?? LanguageCode.EN
      seedPreferences(locale)

      return {
        template:
          '<div style="box-sizing:border-box;min-height:100%;width:100%;background:inherit"><story /></div>'
      }
    }
  ]
} satisfies Meta<typeof SettingsPage>

export default meta
type Story = StoryObj<typeof meta>

/** Default idle settings form (no persist feedback yet). */
export const Default: Story = {
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  }
}

/** German copy via the shared locale toolbar. */
export const DefaultGerman: Story = {
  globals: {
    locale: LanguageCode.DE,
    viewport: { value: 'desktop', isRotated: false }
  }
}

/** After changing theme — success feedback is visible. */
export const AfterChange: Story = {
  globals: {
    locale: LanguageCode.EN,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dark' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Setting saved on this device.')
    await expect(canvas.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
}

/** After change with German chrome / feedback strings. */
export const AfterChangeGerman: Story = {
  globals: {
    locale: LanguageCode.DE,
    viewport: { value: 'desktop', isRotated: false }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Dunkel' }))
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Einstellung auf diesem Gerät gespeichert.'
    )
  }
}
