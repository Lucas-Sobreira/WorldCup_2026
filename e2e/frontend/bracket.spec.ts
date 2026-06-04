import { test, expect } from '@playwright/test';

const DATA_TIMEOUT = 50_000;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait until at least one match card is rendered (confirms API data arrived)
  await page.waitForSelector('[data-testid="match"]', { timeout: DATA_TIMEOUT });
});

test('bracket renders 12 groups', async ({ page }) => {
  await page.getByRole('button', { name: 'Grupos' }).click();
  await expect(page.locator('[data-testid="group"]')).toHaveCount(12, { timeout: DATA_TIMEOUT });
});

test('bracket renders 48 teams', async ({ page }) => {
  await page.getByRole('button', { name: 'Grupos' }).click();
  await expect(page.locator('[data-testid="team"]')).toHaveCount(48, { timeout: DATA_TIMEOUT });
});

test('clicking a match shows prediction probabilities', async ({ page }) => {
  const firstMatch = page.locator('[data-testid="match"]').first();
  await firstMatch.click();
  const modal = page.locator('[data-testid="prediction-modal"]');
  await expect(modal).toBeVisible({ timeout: DATA_TIMEOUT });
  await expect(modal.locator('[data-testid="win-probability"]')).toBeVisible({ timeout: DATA_TIMEOUT });
});
