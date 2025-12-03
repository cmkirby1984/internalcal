import { test, expect } from '@playwright/test';

test.describe('Suites', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to suites page', async ({ page }) => {
    await page.getByRole('link', { name: /suites/i }).click();
    
    await expect(page).toHaveURL('/suites');
    await expect(page.getByRole('heading', { name: /suites/i })).toBeVisible();
  });

  test('should display suite grid', async ({ page }) => {
    await page.goto('/suites');
    
    // Should show suite status filters
    await expect(page.getByText(/vacant|occupied|all/i)).toBeVisible();
    
    // Should show suite cards or empty state
    const suiteCards = page.locator('[data-testid="suite-card"]');
    const emptyState = page.getByText(/no suites/i);
    
    await expect(suiteCards.first().or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('should filter suites by status', async ({ page }) => {
    await page.goto('/suites');
    
    // Click on a status filter
    const vacantButton = page.getByRole('button', { name: /vacant clean/i });
    if (await vacantButton.isVisible()) {
      await vacantButton.click();
      
      // Should filter the grid
      await expect(page).toHaveURL(/status=VACANT_CLEAN|vacant/i);
    }
  });

  test('should open create suite modal', async ({ page }) => {
    await page.goto('/suites');
    
    // Click create suite button
    await page.getByRole('button', { name: /add suite|new suite|create suite/i }).click();
    
    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/add.*suite|create.*suite|new.*suite/i)).toBeVisible();
  });

  test('should show suite details on click', async ({ page }) => {
    await page.goto('/suites');
    
    // Wait for suites to load
    const suiteCard = page.locator('[data-testid="suite-card"]').first();
    
    if (await suiteCard.isVisible()) {
      await suiteCard.click();
      
      // Should navigate to suite details or show modal
      await expect(page.getByText(/suite.*details|suite.*\d+/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

