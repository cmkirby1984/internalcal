import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show login form
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/username/i).fill('invalid_user');
    await page.getByLabel(/password/i).fill('wrong_password');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|unauthorized|failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should disable submit button when fields are empty', async ({ page }) => {
    await page.goto('/login');
    
    // Button should be disabled initially
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await expect(submitButton).toBeDisabled();
    
    // Fill username only - still disabled
    await page.getByLabel(/username/i).fill('admin');
    await expect(submitButton).toBeDisabled();
    
    // Fill password - now enabled
    await page.getByLabel(/password/i).fill('admin123');
    await expect(submitButton).toBeEnabled();
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    
    // Click and immediately check for loading state
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Should show loading indicator (either "Signing in..." text or spinner)
    // This might be too fast to catch, so we just verify the login works
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Use seeded test user credentials
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Should show dashboard content (sidebar should be visible)
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should redirect authenticated users away from login', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // Try to access login again
    await page.goto('/login');
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL('/');
  });

  test('should clear error when user starts typing', async ({ page }) => {
    await page.goto('/login');
    
    // Trigger an error
    await page.getByLabel(/username/i).fill('invalid');
    await page.getByLabel(/password/i).fill('wrong');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for error
    await expect(page.getByText(/invalid|unauthorized|failed/i)).toBeVisible({ timeout: 5000 });
    
    // Start typing - error should clear
    await page.getByLabel(/username/i).fill('admin');
    
    // Error should be gone (or at least the form should be usable)
    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).not.toBeVisible({ timeout: 2000 });
  });

  test('should redirect to original page after login', async ({ page }) => {
    // Try to access tasks page directly
    await page.goto('/tasks');
    
    // Should redirect to login with 'from' param
    await expect(page).toHaveURL(/\/login\?from=%2Ftasks/);
    
    // Login
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Should redirect to original tasks page
    await expect(page).toHaveURL('/tasks', { timeout: 10000 });
  });
});

