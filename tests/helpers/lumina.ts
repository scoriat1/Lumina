import { expect, type Locator, type Page } from '@playwright/test';

const DEV_EMAIL = 'dev@lumina.local';
const DEV_PASSWORD = 'Dev!23456';
export const DEFAULT_PACKAGE_NAME = '4-Session Package';

export function uniqueSuffix() {
  return Date.now().toString().slice(-8);
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEV_EMAIL);
  await page.getByLabel('Password').fill(DEV_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/(dashboard)?$/);
}

export async function createClient(page: Page, clientName: string, email: string) {
  const [firstName, lastName] = clientName.split(' ');

  await page.goto('/clients');
  await page.getByRole('button', { name: 'Add Client' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Add New Client')).toBeVisible();
  await dialog.getByPlaceholder('First Name').fill(firstName);
  await dialog.getByPlaceholder('Last Name').fill(lastName);
  await dialog.getByLabel('Email Address').fill(email);
  await dialog.getByLabel('Phone Number').fill('(555) 867-5309');
  await dialog.getByRole('button', { name: 'Add Client' }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText(clientName, { exact: true })).toBeVisible();
}

export async function openClientDetail(page: Page, clientName: string) {
  await page.goto('/clients');
  await page.getByText(clientName, { exact: true }).click();
  await expect(page).toHaveURL(/\/clients\/\d+$/);
  await expect(page.getByTestId('client-edit-toggle')).toBeVisible();
  await expect(page.getByText(clientName, { exact: true })).toBeVisible();
}

export async function editClientContact(page: Page, nextEmail: string, nextPhone: string) {
  await page.getByTestId('client-edit-toggle').click();
  await page.getByLabel('Email').fill(nextEmail);
  await page.getByLabel('Phone').fill(nextPhone);
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText(nextEmail, { exact: true })).toBeVisible();
  await expect(page.getByText(nextPhone, { exact: true })).toBeVisible();
}

export async function createPackage(page: Page, packageName: string, sessionCount = 6, price = 720) {
  await page.goto('/settings');
  await page.getByText('Packages', { exact: true }).click();
  await expect(page.getByTestId('create-package-button')).toBeVisible();

  await page.getByTestId('create-package-button').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Create Package' })).toBeVisible();
  await dialog.getByLabel('Package Name').fill(packageName);
  await dialog.getByLabel('Sessions').fill(String(sessionCount));
  await dialog.getByLabel('Price').fill(String(price));
  await dialog.getByRole('button', { name: 'Create Package' }).click();

  await expect(dialog).not.toBeVisible();
  const packageCard = page.getByTestId('package-card').filter({
    has: page.getByText(packageName, { exact: true }),
  }).filter({
    hasText: `$${price}`,
  }).first();

  await expect(packageCard.getByText(packageName, { exact: true })).toBeVisible();
  await expect(packageCard.getByTestId('package-session-count')).toHaveText(String(sessionCount));
}

async function selectFutureTime(modal: Locator) {
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const slot = modal.getByTestId('timeline-slot-available').first();
    if (await slot.count()) {
      const timeLabel = (await slot.textContent())?.trim();
      if (!timeLabel) {
        throw new Error('Available timeline slot did not include a time label.');
      }

      await slot.click();
      return timeLabel;
    }

    await modal.getByTestId('session-date-next').click();
  }

  throw new Error('No available timeline slot was found in the next 7 days.');
}

export async function schedulePackageSessions(
  page: Page,
  clientName: string,
  sessionTitle: string,
  packageName = DEFAULT_PACKAGE_NAME,
) {
  await page.goto('/sessions');
  await page.getByRole('button', { name: 'New Session' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Add New Session')).toBeVisible();

  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: clientName }).click();

  await dialog.getByRole('button', { name: 'Package' }).click();
  await dialog.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: new RegExp(packageName) }).click();

  await expect(dialog.getByRole('button', { name: 'Repeating' })).toBeVisible();
  await expect(dialog.locator('input[type="number"]').last()).toHaveValue('4');

  const titleInput = dialog.getByRole('combobox', { name: 'No title' });
  await titleInput.fill(sessionTitle);
  await titleInput.press('Escape');

  const scheduledTimeUi = await selectFutureTime(dialog);
  await dialog.getByRole('button', { name: 'Schedule Session' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15000 });

  return scheduledTimeUi;
}

export async function getScheduledSessionCards(page: Page, clientName: string, sessionTitle: string) {
  await page.goto('/sessions');
  await page.getByPlaceholder('Search by client, session type, or focus...').fill(sessionTitle);

  const cards = page
    .getByTestId('session-card')
    .filter({ hasText: sessionTitle })
    .filter({ hasText: clientName })
    .filter({ hasText: 'Package' });

  await expect(cards).toHaveCount(4, { timeout: 15000 });
  return cards;
}

export async function editSecondSessionTime(page: Page, rows: Locator, updatedTime24h: string, updatedTimeUi: string) {
  await rows.nth(1).click();

  const drawer = page.locator('[role="presentation"]').filter({
    has: page.getByRole('button', { name: 'Edit Session' }),
  }).last();

  await expect(drawer.getByRole('button', { name: 'Edit Session' })).toBeVisible();
  await drawer.getByRole('button', { name: 'Edit Session' }).click();

  const timeInput = page.getByTestId('session-edit-time-input').last();
  await timeInput.fill(updatedTime24h);
  await page.getByRole('button', { name: 'Save Changes' }).last().click();

  await expect(page.getByText('Session updated')).toBeVisible();
  await expect(page.getByText(updatedTimeUi, { exact: true }).first()).toBeVisible();
}
