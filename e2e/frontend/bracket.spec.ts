import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
});

test('bracket renders 12 groups', async ({ page }) => {
  await page.getByRole('button', { name: 'Grupos' }).click();
  const groups = page.locator('[data-testid="group"]');
  await expect(groups).toHaveCount(12, { timeout: 10000 });
});

test('bracket renders 48 teams', async ({ page }) => {
  await page.getByRole('button', { name: 'Grupos' }).click();
  const teams = page.locator('[data-testid="team"]');
  await expect(teams).toHaveCount(48, { timeout: 10000 });
});

test('clicking a match shows prediction probabilities', async ({ page }) => {
  const firstMatch = page.locator('[data-testid="match"]').first();
  await expect(firstMatch).toBeVisible({ timeout: 10000 });
  await firstMatch.click();
  const modal = page.locator('[data-testid="prediction-modal"]');
  await expect(modal).toBeVisible({ timeout: 10000 });
  await expect(modal.locator('[data-testid="win-probability"]')).toBeVisible({ timeout: 10000 });
});
