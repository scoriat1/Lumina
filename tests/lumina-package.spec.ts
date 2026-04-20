import { test } from '@playwright/test';
import { createPackage, login, uniqueSuffix } from './helpers/lumina';

test('creates a package', async ({ page }) => {
  const suffix = uniqueSuffix();
  const packageName = `Playwright Package ${suffix}`;

  await login(page);
  await createPackage(page, packageName, 6, 720);
});
