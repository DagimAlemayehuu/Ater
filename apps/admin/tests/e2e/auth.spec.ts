import { test, expect } from '@playwright/test';

test.describe('Admin Auth Guard', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
    
    // Check for login title
    const loginHeader = page.locator('h1');
    await expect(loginHeader).toContainText('Admin');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@ater.ai');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errorMsg = page.locator('text=Invalid');
    await expect(errorMsg).toBeVisible();
  });
});
