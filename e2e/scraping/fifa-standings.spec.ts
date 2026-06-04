import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface GroupStanding {
  group: string;
  teams: { rank: number; name: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number }[];
}

test('scrape 2026 group standings → dataset/live_standings_2026.json', async ({ page }) => {
  await page.goto('https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/standings');
  await page.waitForLoadState('networkidle');

  // Wait for standings tables to render
  await page.waitForSelector('table', { timeout: 15000 }).catch(() => null);

  const standings: GroupStanding[] = await page.evaluate(() => {
    const results: GroupStanding[] = [];
    const groupPattern = /^(Grupo|Group)\s+[A-L]$/i;

    for (const table of Array.from(document.querySelectorAll('table'))) {
      // Walk backward through siblings and ancestors to find a group header
      let groupName = '';
      let cursor: Element | null = table;
      outer: while (cursor) {
        let sib: Element | null = cursor;
        while ((sib = sib.previousElementSibling)) {
          const text = sib.textContent?.trim() ?? '';
          if (groupPattern.test(text)) { groupName = text; break outer; }
          // header might be nested — check descendants too
          const nested = Array.from(sib.querySelectorAll('h1,h2,h3,h4,h5,h6,[data-group]'))
            .find(el => groupPattern.test(el.textContent?.trim() ?? ''));
          if (nested) { groupName = nested.textContent?.trim() ?? ''; break outer; }
        }
        cursor = cursor.parentElement;
      }
      if (!groupName) continue;

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const teams = rows.map((row, i) => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.textContent?.trim() ?? '');
        return {
          rank: i + 1,
          name: cells[1] || cells[0] || '',
          played: Number(cells[2]) || 0,
          won:    Number(cells[3]) || 0,
          drawn:  Number(cells[4]) || 0,
          lost:   Number(cells[5]) || 0,
          gf:     Number(cells[6]) || 0,
          ga:     Number(cells[7]) || 0,
          gd:     Number(cells[8]) || 0,
          points: Number(cells[9]) || 0,
        };
      }).filter(t => t.name.length > 0);

      if (teams.length > 0) results.push({ group: groupName, teams });
    }
    return results;
  });

  expect(standings.length).toBeGreaterThan(0);

  const outPath = path.join(__dirname, '..', '..', 'dataset', 'live_standings_2026.json');
  fs.writeFileSync(outPath, JSON.stringify(standings, null, 2));
  console.log(`Saved ${standings.length} groups to ${outPath}`);
});
