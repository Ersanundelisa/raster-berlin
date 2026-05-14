import { test, expect } from '@playwright/test'

test('landing page shows headline and nav', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Berlin Art Guide')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Map' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Events' })).toBeVisible()
})

test('mobile nav shows hamburger menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByLabel('Toggle menu')).toBeVisible()
  await page.getByLabel('Toggle menu').click()
  await expect(page.getByRole('link', { name: 'Galleries' })).toBeVisible()
})
