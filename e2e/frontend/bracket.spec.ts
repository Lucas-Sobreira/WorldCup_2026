import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('bracket renders 12 groups', async ({ page }) => {
  const groups = page.locator('[data-testid="group"]');
  await expect(groups).toHaveCount(12);
});

test('bracket renders 48 teams', async ({ page }) => {
  const teams = page.locator('[data-testid="team"]');
  await expect(teams).toHaveCount(48);
});

test('clicking a match shows prediction probabilities', async ({ page }) => {
  const firstMatch = page.locator('[data-testid="match"]').first();
  await firstMatch.click();
  const modal = page.locator('[data-testid="prediction-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('[data-testid="win-probability"]')).toBeVisible();
});
