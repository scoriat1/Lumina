import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './RootLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { CalendarPage } from './pages/CalendarPage';
import { SessionsPage } from './pages/SessionsPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductRulesPage } from './pages/ProductRulesPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { LandingLayout } from './components/landing/LandingLayout';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { SignupPage } from './pages/SignupPage';

export const router = createBrowserRouter([
  {
    element: <LandingLayout />,
    children: [
      { index: true, Component: LandingPage },
      { path: 'features', element: <Navigate to="/" replace /> },
      { path: 'pricing', Component: PricingPage },
      { path: 'contact', Component: ContactPage },
      { path: 'signup', Component: SignupPage },
      { path: 'login', Component: LoginPage },
    ],
  },
  {
    path: '/unauthorized',
    Component: UnauthorizedPage,
  },
  {
    path: '/',
    element: <ProtectedRoute><RootLayout /></ProtectedRoute>,
    children: [
      { path: 'app', Component: DashboardPage },
      { path: 'product-rules', Component: ProductRulesPage },
      { path: 'clients', Component: ClientsPage },
      { path: 'clients/:id', Component: ClientDetailPage },
      { path: 'calendar', Component: CalendarPage },
      { path: 'billing', Component: BillingPage },
      { path: 'sessions', Component: SessionsPage },
      { path: 'reports', Component: ReportsPage },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'settings', Component: SettingsPage },
    ],
  },
]);
