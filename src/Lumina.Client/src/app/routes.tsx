import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './RootLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { CalendarPage } from './pages/CalendarPage';
import { SessionsPage } from './pages/SessionsPage';
import { BillingPage } from './pages/BillingPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductRulesPage } from './pages/ProductRulesPage';
import { LoginPage } from './pages/LoginPage';
import { RequireAuth } from './components/auth/RequireAuth';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/',
        Component: RootLayout,
        children: [
          {
            index: true,
            Component: DashboardPage,
          },
          {
            path: 'product-rules',
            Component: ProductRulesPage,
          },
          {
            path: 'clients',
            Component: ClientsPage,
          },
          {
            path: 'clients/:id',
            Component: ClientDetailPage,
          },
          {
            path: 'calendar',
            Component: CalendarPage,
          },
          {
            path: 'billing',
            Component: BillingPage,
          },
          {
            path: 'sessions',
            Component: SessionsPage,
          },
          {
            path: 'resources',
            Component: ResourcesPage,
          },
          {
            path: 'notifications',
            Component: NotificationsPage,
          },
          {
            path: 'settings',
            Component: SettingsPage,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
