import { Navigate } from 'react-router';
import { logoutRedirectFlagKey, useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user && sessionStorage.getItem(logoutRedirectFlagKey) === '1') {
    sessionStorage.removeItem(logoutRedirectFlagKey);
    return <Navigate to="/login?loggedOut=1" replace />;
  }
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
