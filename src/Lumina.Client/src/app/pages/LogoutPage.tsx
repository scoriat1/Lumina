import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout().catch(() => {
      // Logout clears local auth state in finally; the route can still continue to login.
    });
  }, [logout]);

  return <Navigate to="/login?loggedOut=1" replace />;
}
