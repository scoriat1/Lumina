import { test } from '@playwright/test';
import {
  createClient,
  editClientContact,
  login,
  openClientDetail,
  uniqueSuffix,
} from './helpers/lumina';

test('creates and edits a client', async ({ page }) => {
  const suffix = uniqueSuffix();
  const clientName = `Playwright ${suffix}`;
  const email = `playwright.${suffix}@example.com`;
  const updatedEmail = `playwright.updated.${suffix}@example.com`;
  const updatedPhone = '(555) 111-2233';

  await login(page);
  await createClient(page, clientName, email);
  await openClientDetail(page, clientName);
  await editClientContact(page, updatedEmail, updatedPhone);
});
