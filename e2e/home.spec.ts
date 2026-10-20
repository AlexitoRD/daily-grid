import { expect, test } from '@playwright/test';

test('homepage loads with the title and today’s date', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Daily Grid');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Daily Grid' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: "Today's puzzle is coming soon" }),
  ).toBeVisible();

  // The date is filled in by a browser script using the visitor's local day.
  const date = page.getByTestId('today-date');
  await expect(date).not.toBeEmpty();
  const today = await page.evaluate(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  await expect(date).toHaveAttribute('datetime', today);
});
