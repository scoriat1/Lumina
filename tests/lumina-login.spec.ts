import { expect, test } from '@playwright/test';
import { login } from './helpers/lumina';

test('logs in with the seeded dev user', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});
