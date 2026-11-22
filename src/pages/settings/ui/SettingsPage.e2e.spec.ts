import { expect, test } from '@playwright/test'

test.describe('Settings page', () => {
  test('opens settings and shows feedback after a persisted theme change', async ({ page }) => {
    await page.goto('/')

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Settings' })
      .click()

    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Appearance' })).toBeVisible()

    await page.getByRole('button', { name: 'Dark' }).click()

    await expect(page.getByRole('status')).toHaveText('Setting saved on this device.')
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')

    await page.reload()

    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark')
  })
})
