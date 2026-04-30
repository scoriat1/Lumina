import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { AuthMeDto } from '../api/types';

interface AuthContextType {
  user: AuthMeDto | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: { fullName: string; email: string; password: string; practiceName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const logoutRedirectFlagKey = 'lumina:logoutRedirect';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthMeDto | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await apiClient.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    await apiClient.login(email, password);
    await refresh();
  };

  const signup = async (payload: { fullName: string; email: string; password: string; practiceName: string }) => {
    await apiClient.signup(payload);
    await refresh();
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      sessionStorage.setItem(logoutRedirectFlagKey, '1');
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, loading, refresh, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
