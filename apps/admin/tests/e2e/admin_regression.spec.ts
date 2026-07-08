import { test, expect } from '@playwright/test';

test.describe('Admin System Dashboard & Authentication Routing Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root dashboard with bypass=true to ensure we are in mock mode
    await page.goto('/?bypass=true');
  });

  test('should display the core control dashboard layout and main headings', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Controller' })).toBeVisible();
    
    // Ensure vital stats cards render
    const statsCards = page.locator('div').filter({ hasText: /Users|Revenue|Leases/i });
    await expect(statsCards.first()).toBeVisible();
  });

  test('should gracefully handle configuration navigation tabs', async ({ page }) => {
    // Check main navigation links or layout existence
    const mainContainer = page.locator('main').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should redirect unauthenticated sessions from private routes to root or auth flows', async ({ page }) => {
    // In our new AdminGuard, unauthenticated users without session are redirected to /login
    // But if we are in mock mode (?bypass=true), the hybridSupabase might mock the session.
    // However, for this specific test, we want to see if redirection works when NO bypass is present.
    await page.goto('/users');
    // Since there's no session and no bypass=true on this specific navigation, it should redirect to /login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
