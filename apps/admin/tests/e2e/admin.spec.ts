import { test, expect } from '@playwright/test';

test('admin portal screens load successfully', async ({ page }) => {
  // Check the Dashboard (root) with bypass to mock session
  await page.goto('/?bypass=true');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();

  // Check /login is accessible without redirect when not logged in
  // First clear any potential session by going to /login without bypass
  await page.goto('/login');
  await expect(page).toHaveURL(/.*\/login/);
});
