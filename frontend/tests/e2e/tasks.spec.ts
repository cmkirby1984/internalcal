import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.getByRole('link', { name: /tasks/i }).click();
    
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
  });

  test('should display task list', async ({ page }) => {
    await page.goto('/tasks');
    
    // Should show task filters
    await expect(page.getByText(/all tasks|pending|in progress/i)).toBeVisible();
    
    // Should show task cards or empty state
    const taskCards = page.locator('[data-testid="task-card"]');
    const emptyState = page.getByText(/no tasks/i);
    
    // Either tasks exist or empty state is shown
    await expect(taskCards.first().or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('should open create task modal', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click create task button
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    
    // Modal should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/create.*task/i)).toBeVisible();
    
    // Form fields should be present
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Open create modal
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill form
    await page.getByLabel(/title/i).fill('E2E Test Task');
    await page.getByLabel(/type/i).selectOption({ index: 1 });
    
    // Submit
    await page.getByRole('button', { name: /create task/i }).click();
    
    // Modal should close and task should appear
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Success toast should appear
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5000 });
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click on a status filter
    await page.getByRole('button', { name: /pending/i }).click();
    
    // URL should update with filter
    await expect(page).toHaveURL(/status=PENDING|pending/i);
  });
});

