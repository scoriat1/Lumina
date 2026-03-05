import { expect, test, type Page } from '@playwright/test';

const authMe = {
  userId: 'u1',
  email: 'provider@lumina.test',
  displayName: 'Taylor Provider',
  initials: 'TP',
  practiceId: '1',
  providerId: '10',
  role: 'admin',
};

const clients = [
  {
    id: '1',
    name: 'Ava Carter',
    initials: 'AC',
    avatarColor: '#9B8B9E',
    program: 'Executive Coaching',
    progress: 40,
    sessionsCompleted: 4,
    totalSessions: 10,
    nextSession: 'Tomorrow 9:00 AM',
    status: 'active',
    email: 'ava@example.com',
    phone: '555-1111',
    startDate: '2026-01-01',
    notes: 'Prefers morning sessions.',
  },
  {
    id: '2',
    name: 'Noah Brooks',
    initials: 'NB',
    avatarColor: '#A8B5A0',
    program: 'Leadership Growth',
    progress: 60,
    sessionsCompleted: 6,
    totalSessions: 10,
    nextSession: 'Friday 2:00 PM',
    status: 'active',
    email: 'noah@example.com',
    phone: '555-2222',
    startDate: '2026-01-10',
  },
];

const sessions = [
  {
    id: 's1',
    clientId: '1',
    client: 'Ava Carter',
    initials: 'AC',
    avatarColor: '#9B8B9E',
    sessionType: 'Weekly Check-in',
    date: '2026-03-12T14:00:00.000Z',
    duration: 60,
    location: 'zoom',
    status: 'upcoming',
    paymentStatus: 'invoiced',
    focus: 'Leadership alignment',
    notes: 'Progressing well.',
  },
  {
    id: 's2',
    clientId: '1',
    client: 'Ava Carter',
    initials: 'AC',
    avatarColor: '#9B8B9E',
    sessionType: 'Follow-up Session',
    date: '2026-02-20T14:00:00.000Z',
    duration: 60,
    location: 'phone',
    status: 'completed',
    paymentStatus: 'paid',
    focus: 'Communication',
    notes: 'Great outcome.',
  },
];

const invoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-1001',
    clientName: 'Ava Carter',
    clientId: '1',
    clientInitials: 'AC',
    clientColor: '#9B8B9E',
    amount: 250,
    date: '2026-03-01T00:00:00.000Z',
    dueDate: '2026-03-15T00:00:00.000Z',
    status: 'pending',
    sessionCount: '2',
    description: 'Coaching sessions',
  },
];

async function mockApi(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const { pathname, searchParams } = url;

    const json = (body: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

    if (pathname === '/api/auth/me') return json(authMe);
    if (pathname === '/api/templates/presets') return json([]);
    if (pathname === '/api/templates/custom') return json([]);
    if (pathname === '/api/dashboard') {
      return json({
        activeClients: 2,
        sessionsThisMonth: 3,
        revenueMtd: 1250,
        calendarFilledPercent: 72,
        upcomingSessions: [sessions[0]],
        activeClientPreview: clients,
      });
    }
    if (pathname === '/api/clients' && route.request().method() === 'GET') return json(clients);
    if (pathname.startsWith('/api/clients/') && pathname.endsWith('/sessions')) return json(sessions);
    if (pathname.startsWith('/api/clients/')) {
      const id = pathname.split('/').pop();
      return json(clients.find((c) => c.id === id) ?? clients[0]);
    }
    if (pathname === '/api/sessions') {
      const clientId = searchParams.get('clientId');
      return json(clientId ? sessions.filter((s) => s.clientId === clientId) : sessions);
    }
    if (pathname.startsWith('/api/sessions/')) {
      const id = pathname.split('/').pop();
      return json(sessions.find((s) => s.id === id) ?? sessions[0]);
    }
    if (pathname === '/api/billing/summary') return json({ totalRevenue: 10000, pendingAmount: 250, overdueAmount: 0 });
    if (pathname === '/api/billing/invoices') return json(invoices);
    if (pathname === '/api/settings/providers') return json([]);

    return json({});
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('sidebar navigation icons update URL paths', async ({ page }) => {
  await page.goto('/');

  const navTargets = [
    { testId: 'sidebar-nav-dashboard', path: '/' },
    { testId: 'sidebar-nav-clients', path: '/clients' },
    { testId: 'sidebar-nav-calendar', path: '/calendar' },
    { testId: 'sidebar-nav-sessions', path: '/sessions' },
    { testId: 'sidebar-nav-billing', path: '/billing' },
    { testId: 'sidebar-nav-resources', path: '/resources' },
    { testId: 'sidebar-nav-notifications', path: '/notifications' },
    { testId: 'sidebar-nav-settings', path: '/settings' },
  ];

  for (const target of navTargets) {
    await page.getByTestId(target.testId).first().click();
    await expect(page).toHaveURL(new RegExp(`${target.path.replace('/', '\\/')}$`));
  }
});

test('dashboard metric cards and view-all links navigate with expected route context', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('metric-card-active-clients').click();
  await expect(page).toHaveURL(/\/clients\?status=active/);

  await page.goto('/');
  await page.getByTestId('metric-card-sessions-this-month').click();
  await expect(page).toHaveURL(/\/sessions\?range=thisMonth/);

  await page.goto('/');
  await page.getByTestId('metric-card-revenue-mtd').click();
  await expect(page).toHaveURL(/\/billing\?range=thisMonth/);

  await page.goto('/');
  await page.getByTestId('metric-card-calendar-filled').click();
  await expect(page).toHaveURL(/\/calendar\?range=thisMonth/);

  await page.goto('/');
  await page.getByTestId('dashboard-upcoming-view-all').click();
  await expect(page).toHaveURL(/\/sessions\?range=upcoming/);

  await page.goto('/');
  await page.getByTestId('dashboard-clients-view-all').click();
  await expect(page).toHaveURL(/\/clients\?status=active/);
});

test('clients list opens client detail route from first row', async ({ page }) => {
  await page.goto('/clients');
  await page.getByTestId('clients-row-1').click();
  await expect(page).toHaveURL(/\/clients\/1$/);
});

test('client detail new session CTA opens and closes modal', async ({ page }) => {
  await page.goto('/clients/1');
  await page.getByTestId('client-detail-new-session').click();
  await expect(page.getByTestId('new-session-modal')).toBeVisible();
  await page.getByTestId('new-session-modal-close').click();
  await expect(page.getByTestId('new-session-modal')).toBeHidden();
});

test('client detail session row opens and closes session details drawer', async ({ page }) => {
  await page.goto('/clients/1');
  await page.getByTestId('client-detail-session-row-s1').click();
  await expect(page.getByTestId('session-details-drawer')).toBeVisible();
  await page.getByTestId('session-details-drawer-close').click();
  await expect(page.getByTestId('session-details-drawer')).toBeHidden();
});

test('billing invoice row opens and closes invoice drawer', async ({ page }) => {
  await page.goto('/billing');
  await page.getByTestId('billing-invoice-row-inv-1').click();
  await expect(page.getByTestId('billing-invoice-drawer')).toBeVisible();
  await page.getByTestId('billing-invoice-drawer-close').click();
  await expect(page.getByTestId('billing-invoice-drawer')).toBeHidden();
});

test('settings TODO CTAs are explicitly disabled', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByRole('button', { name: 'Upload Logo' })).toBeDisabled();

  await page.getByText('Providers').first().click();
  await expect(page.getByRole('button', { name: 'Invite Provider' })).toBeDisabled();

  await page.getByText('Packages').first().click();
  await expect(page.getByRole('button', { name: 'Create Package' })).toBeDisabled();

  await page.getByText('Availability').first().click();
  await expect(page.getByRole('button', { name: 'Add time slot' })).toBeDisabled();

  await page.getByText('Roles & Permissions').first().click();
  await expect(page.locator('button[disabled]').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first()).toBeVisible();
});
