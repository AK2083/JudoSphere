import { expect, test } from '@playwright/test'

import { APP_PREFERENCES_STORAGE_KEY } from '../src/shared/lib/preferences/defaults'

/**
 * Complete preferences bag matching the shared `localStorage` model
 * (`AppPreferences`), with non-default theme + language for apply-on-start checks.
 */
const SEEDED_PREFERENCES = {
  theme: 'dark',
  language: 'de',
  confirmations: {
    disclaimer: {
      version: null,
      acceptedAt: null
    }
  }
} as const

test.describe('Apply persisted theme & language on start', () => {
  test('reload applies stored dark theme and German locale from localStorage', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(
      ({ key, preferences }) => {
        localStorage.setItem(key, JSON.stringify(preferences))
      },
      { key: APP_PREFERENCES_STORAGE_KEY, preferences: SEEDED_PREFERENCES }
    )

    await page.reload()

    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('lang', 'de')

    await expect(
      page.getByRole('navigation', { name: 'Hauptnavigation' }).getByRole('link', {
        name: 'Einstellungen'
      })
    ).toBeVisible()

    await expect(
      page.getByText(
        'Offline-first Software für kleinere Judowettkämpfe und Vereine. Die Host-Anwendung stellt die UI im lokalen Netzwerk bereit.'
      )
    ).toBeVisible()

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      APP_PREFERENCES_STORAGE_KEY
    )
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toMatchObject({
      theme: 'dark',
      language: 'de'
    })
  })
})
