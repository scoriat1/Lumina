import { expect, test } from '@playwright/test';
import {
  createClient,
  editSecondSessionTime,
  getScheduledSessionCards,
  login,
  schedulePackageSessions,
  uniqueSuffix,
} from './helpers/lumina';

test('schedules package sessions and edits the second session time', async ({ page }) => {
  const suffix = uniqueSuffix();
  const clientName = `Playwright ${suffix}`;
  const email = `playwright.${suffix}@example.com`;
  const sessionTitle = `Package Flow ${suffix}`;
  const updatedTime24h = '11:30';
  const updatedTimeUi = '11:30 AM';

  await login(page);
  await createClient(page, clientName, email);
  const scheduledTimeUi = await schedulePackageSessions(page, clientName, sessionTitle);

  const rows = await getScheduledSessionCards(page, clientName, sessionTitle);
  await expect(rows.first()).toContainText(scheduledTimeUi);

  await editSecondSessionTime(page, rows, updatedTime24h, updatedTimeUi);

  const updatedRows = await getScheduledSessionCards(page, clientName, sessionTitle);
  await expect(updatedRows.nth(1)).toContainText(updatedTimeUi);
});
