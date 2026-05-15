import { test, expect } from '@playwright/test'

test('events page shows filter buttons', async ({ page }) => {
  await page.goto('/events')
  await expect(page.getByText('Opening')).toBeVisible()
  await expect(page.getByText('Talk')).toBeVisible()
})

test('free only filter works', async ({ page }) => {
  await page.goto('/events')
  await page.getByText('Free only').click()
  await expect(page.getByText('Free only')).toHaveClass(/bg-green-600/)
})
