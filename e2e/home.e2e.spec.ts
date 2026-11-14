import { expect, test } from '@playwright/test'

test.describe('Home page', () => {
  test('shows the JudoSphere title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'JudoSphere' })).toBeVisible()
  })
})
