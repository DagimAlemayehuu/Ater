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

test('admin login accepts the local owner credentials', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('dagimalemayehuu@gmail.com');
  await page.getByLabel('Password').fill('0000');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/.*\/\?bypass=true/);
  await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();
});
