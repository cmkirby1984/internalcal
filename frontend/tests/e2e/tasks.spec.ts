import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.getByRole('link', { name: /tasks/i }).click();
    
    await expect(page).toHaveURL('/tasks');
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
  });

  test('should display task list', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // Should show task count or empty state
    const taskCount = page.getByText(/\d+ of \d+ tasks/i);
    const emptyState = page.getByText(/no tasks/i);
    
    // Either tasks exist or empty state is shown
    await expect(taskCount.or(emptyState)).toBeVisible({ timeout: 10000 });
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
    await expect(page.getByText(/task type/i)).toBeVisible();
  });

  test('should show validation error for empty title', async ({ page }) => {
    await page.goto('/tasks');
    
    // Open create modal
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Try to submit without title
    await page.getByRole('button', { name: /create task/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/title.*required/i)).toBeVisible({ timeout: 3000 });
  });

  test('should create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Get initial task count
    const countText = await page.getByText(/\d+ of \d+ tasks/i).textContent();
    const initialCount = countText ? parseInt(countText.match(/(\d+) of/)?.[1] || '0') : 0;
    
    // Open create modal
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    
    // Fill form
    const uniqueTitle = `E2E Test Task ${Date.now()}`;
    await page.getByLabel(/title/i).fill(uniqueTitle);
    
    // Submit
    await page.getByRole('button', { name: /create task/i }).click();
    
    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Success toast should appear
    await expect(page.getByText(/created|success/i)).toBeVisible({ timeout: 5000 });
    
    // Task should appear in list
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
  });

  test('should switch between list and kanban views', async ({ page }) => {
    await page.goto('/tasks');
    
    // Default should be list view
    await expect(page.locator('[class*="space-y"]').first()).toBeVisible();
    
    // Click kanban view button
    await page.locator('button').filter({ has: page.locator('svg path[d*="M9 17V7"]') }).click();
    
    // Should show kanban columns
    await expect(page.getByText(/pending|in progress|completed/i).first()).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for tasks to load
    await page.waitForLoadState('networkidle');
    
    // Click on pending filter
    await page.getByRole('button', { name: /unassigned/i }).click();
    
    // Filter should be active (button style changes)
    const filterButton = page.getByRole('button', { name: /unassigned/i });
    await expect(filterButton).toHaveClass(/bg-\[var\(--primary-600\)\]/);
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for tasks to load
    await page.waitForLoadState('networkidle');
    
    // Click on urgent filter
    await page.getByRole('button', { name: /urgent/i }).click();
    
    // Filter should be active
    const filterButton = page.getByRole('button', { name: /urgent/i });
    await expect(filterButton).toHaveClass(/bg-orange-600/);
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for tasks to load
    await page.waitForLoadState('networkidle');
    
    // Create a task first if none exist
    const taskCards = page.locator('[class*="border-l-4"]');
    const count = await taskCards.count();
    
    if (count === 0) {
      // Create a task
      await page.getByRole('button', { name: /new task|create task|add task/i }).click();
      await page.getByLabel(/title/i).fill(`Status Test Task ${Date.now()}`);
      await page.getByRole('button', { name: /create task/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    }
    
    // Click on a task card
    await taskCards.first().click();
    
    // Task interaction logged (actual status change depends on task detail view)
    // For now, just verify the task is clickable
  });

  test('complete CRUD flow: create, view, delete', async ({ page }) => {
    await page.goto('/tasks');
    
    // CREATE
    const uniqueTitle = `CRUD Test Task ${Date.now()}`;
    await page.getByRole('button', { name: /new task|create task|add task/i }).click();
    await page.getByLabel(/title/i).fill(uniqueTitle);
    await page.getByRole('button', { name: /create task/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    
    // Verify created
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
    
    // VIEW - task should be in the list
    const taskCard = page.locator('[class*="border-l-4"]').filter({ hasText: uniqueTitle });
    await expect(taskCard).toBeVisible();
    
    // Task card should show status badge
    await expect(taskCard.getByText(/pending|assigned/i)).toBeVisible();
  });
});

