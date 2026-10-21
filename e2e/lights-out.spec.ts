import { expect, test } from '@playwright/test';
import {
  applyPresses,
  dailyPuzzle,
  emptyGrid,
  randomPresses,
} from '../src/games/lights-out/logic';
import { createRng, dateKey, seedFromKey } from '../src/lib/daily-seed';
import { shareDate } from '../src/lib/share';

const cells = (page: import('@playwright/test').Page) =>
  page.getByRole('group', { name: 'Lights Out board' }).getByRole('button');

const states = (page: import('@playwright/test').Page) =>
  cells(page).evaluateAll((buttons) =>
    buttons.map((b) => b.getAttribute('aria-pressed')),
  );

test('Lights Out loads, and pressing a cell changes the grid and moves', async ({
  page,
}) => {
  await page.goto('/games/lights-out');

  await expect(page).toHaveTitle('Lights Out · Daily Grid');
  await expect(cells(page)).toHaveCount(25);
  await expect(page.getByTestId('lights-out-moves')).toHaveText('Moves: 0');

  const before = await states(page);
  // The centre cell toggles itself and its four neighbours.
  await page.getByRole('button', { name: /^Row 3, column 3, / }).click();

  await expect(page.getByTestId('lights-out-moves')).toHaveText('Moves: 1');
  const after = await states(page);
  const changed = after
    .map((state, i) => (state === before[i] ? null : i))
    .filter((i) => i !== null);
  expect(changed).toEqual([7, 11, 12, 13, 17]);

  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByTestId('lights-out-moves')).toHaveText('Moves: 0');
  expect(await states(page)).toEqual(before);
});

test('Lights Out is keyboard playable', async ({ page }) => {
  await page.goto('/games/lights-out');

  const first = page.getByRole('button', { name: /^Row 1, column 1, / });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('button', { name: /^Row 2, column 2, / }),
  ).toBeFocused();

  const before = await states(page);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('lights-out-moves')).toHaveText('Moves: 1');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('lights-out-moves')).toHaveText('Moves: 2');
  // Pressing the same cell twice puts the grid back.
  expect(await states(page)).toEqual(before);
});

test('Lights Out shows a message when solved', async ({ page }) => {
  await page.goto('/games/lights-out');
  await expect(cells(page)).toHaveCount(25);

  // Today's puzzle was made by pressing these cells, so pressing them again
  // solves it.
  const presses = randomPresses(createRng(seedFromKey(dateKey(new Date()))));
  expect(applyPresses(emptyGrid(), presses)).toEqual(dailyPuzzle(new Date()));
  for (const index of presses) await cells(page).nth(index).click();

  await expect(page.getByTestId('lights-out-solved')).toHaveText(
    `Solved in ${presses.length} moves!`,
  );
  expect(await states(page)).toEqual(Array(25).fill('false'));
});

test('Lights Out can share the result once solved', async ({
  page,
  context,
}) => {
  // Desktop Chromium has a fine pointer, so Share should copy even when a
  // share sheet exists. Provide one that records calls to check it is unused.
  await page.addInitScript(() => {
    const w = window as typeof window & { shareCalls: number };
    w.shareCalls = 0;
    Object.defineProperty(Navigator.prototype, 'share', {
      configurable: true,
      value: async () => {
        w.shareCalls++;
      },
    });
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/games/lights-out');
  await expect(cells(page)).toHaveCount(25);
  expect(
    await page.evaluate(() => ({
      share: typeof navigator.share,
      coarse: matchMedia('(pointer: coarse)').matches,
    })),
  ).toEqual({ share: 'function', coarse: false });

  const share = page.getByRole('button', { name: 'Share' });
  await expect(share).toHaveCount(0);

  const today = new Date();
  const presses = randomPresses(createRng(seedFromKey(dateKey(today))));
  for (const index of presses) await cells(page).nth(index).click();

  // Keyboard: focus the button and press Enter.
  await share.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('share-message')).toHaveText('Copied!');
  expect(
    await page.evaluate(
      () => (window as typeof window & { shareCalls: number }).shareCalls,
    ),
  ).toBe(0);

  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe(
    [
      `Daily Grid · Lights Out · ${shareDate(today)}`,
      `Solved in ${presses.length} moves`,
      new URL('/games/lights-out', page.url()).href,
    ].join('\n'),
  );
});

test('Lights Out fits a phone screen without horizontal scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/games/lights-out');
  await expect(cells(page)).toHaveCount(25);

  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
  expect(await overflow()).toBeLessThanOrEqual(0);

  // Still fits once solved and the Share button appears.
  const presses = randomPresses(createRng(seedFromKey(dateKey(new Date()))));
  for (const index of presses) await cells(page).nth(index).click();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
});
