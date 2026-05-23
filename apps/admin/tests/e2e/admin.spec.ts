import { test, expect } from '@playwright/test';

test('admin dashboard login screen loads successfully', async ({ page }) => {
  await page.goto('/');
  // Basic smoke test to ensure the admin page renders
  await expect(page.locator('body')).toBeVisible();
  
  // Wait for network idle or DOMContentLoaded
  await page.waitForLoadState('domcontentloaded');
});
