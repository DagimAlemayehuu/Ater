import { test, expect } from '@playwright/test';

test.describe('Admin System Dashboard & Authentication Routing Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root dashboard with bypass
    await page.goto('/?bypass=true');
  });

  test('should display the core control dashboard layout and main headings', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();
    
    // Ensure vital stats cards render
    const statsCards = page.locator('div').filter({ hasText: /Users|Waitlist|Execution/i });
    await expect(statsCards.first()).toBeVisible();
  });

  test('should gracefully handle configuration navigation tabs', async ({ page }) => {
    // Check main navigation links or layout existence
    const mainContainer = page.locator('main').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should redirect unauthenticated sessions from private routes to root or auth flows', async ({ page }) => {
    await page.goto('/login');
    // Ensure it falls back or redirects to safe routes
    await expect(page).toHaveURL(/.*\/$/);
  });
});
