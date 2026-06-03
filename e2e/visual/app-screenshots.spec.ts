import { test } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

test('capture FIFA 2026 standings page', async ({ page }) => {
  await page.goto('https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'fifa-standings.png'),
    fullPage: true,
  });
});

test('capture FIFA 2026 matches page', async ({ page }) => {
  await page.goto('https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/matches');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, 'fifa-matches.png'),
    fullPage: true,
  });
});
