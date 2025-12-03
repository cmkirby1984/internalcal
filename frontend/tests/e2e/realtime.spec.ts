import { test, expect } from '@playwright/test';

test.describe('Real-time Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should show connection status indicator', async ({ page }) => {
    // Look for connection indicator in header
    const liveIndicator = page.getByText(/live|connected|online/i);
    const offlineIndicator = page.getByText(/offline|disconnected|reconnecting/i);
    
    // Either connected or disconnected indicator should be visible
    await expect(liveIndicator.or(offlineIndicator)).toBeVisible({ timeout: 10000 });
  });

  test('should handle offline mode gracefully', async ({ page, context }) => {
    await page.goto('/tasks');
    
    // Go offline
    await context.setOffline(true);
    
    // Wait a moment for the app to detect offline state
    await page.waitForTimeout(2000);
    
    // Should show offline indicator
    await expect(page.getByText(/offline|disconnected/i)).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await context.setOffline(false);
    
    // Should reconnect
    await expect(page.getByText(/live|connected|online|reconnecting/i)).toBeVisible({ timeout: 10000 });
  });

  test('should queue changes when offline', async ({ page, context }) => {
    await page.goto('/tasks');
    
    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);
    
    // Try to create a task
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    await page.getByLabel(/title/i).fill('Offline Task');
    await page.getByLabel(/type/i).selectOption({ index: 1 });
    await page.getByRole('button', { name: /create task/i }).click();
    
    // Should show offline message
    await expect(page.getByText(/offline|pending|queued/i)).toBeVisible({ timeout: 5000 });
    
    // Should show pending indicator
    await expect(page.getByText(/pending/i)).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Should sync and show success
    await expect(page.getByText(/synced|success|connected/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Multi-browser Sync', () => {
  test('should sync task creation across browsers', async ({ browser }) => {
    // Create two browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login both users
    for (const page of [page1, page2]) {
      await page.goto('/login');
      await page.getByLabel(/username/i).fill('admin');
      await page.getByLabel(/password/i).fill('admin123');
      await page.getByRole('button', { name: /login/i }).click();
      await expect(page).toHaveURL('/');
    }
    
    // Navigate both to tasks page
    await page1.goto('/tasks');
    await page2.goto('/tasks');
    
    // Create a task in page1
    await page1.getByRole('button', { name: /new task|create task|add task/i }).click();
    await page1.getByLabel(/title/i).fill('Sync Test Task');
    await page1.getByLabel(/type/i).selectOption({ index: 1 });
    await page1.getByRole('button', { name: /create task/i }).click();
    
    // Wait for sync
    await page1.waitForTimeout(3000);
    
    // Refresh page2 to see if task synced (in real-time it would auto-update)
    await page2.reload();
    
    // Task should appear in page2
    await expect(page2.getByText('Sync Test Task')).toBeVisible({ timeout: 10000 });
    
    // Cleanup
    await context1.close();
    await context2.close();
  });
});

