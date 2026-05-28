import { test, expect } from '@playwright/test';

test('admin portal screens load successfully', async ({ page }) => {
  // Check the Dashboard (root)
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();

  // Check that visiting /login redirects to /
  await page.goto('/login');
  await expect(page).toHaveURL(/.*\/$/); // Redirects to root URL (/)
  await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();
});
