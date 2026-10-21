import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Holyann/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Click the get started link.
  // Replace with a selector that actually exists in your app, e.g., 'text=Get Started' or similar.
  // await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  // await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
