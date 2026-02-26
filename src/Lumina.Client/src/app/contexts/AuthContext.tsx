import { createContext, useContext, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithOAuth: (provider: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'lumina.auth.token';
const USER_STORAGE_KEY = 'lumina.auth.user';

function readStoredUser(): AuthUser | null {
  const value = localStorage.getItem(USER_STORAGE_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const loginWithOAuth = async (provider: string) => {
    const result = await apiClient.oauthLogin(provider);
    setToken(result.accessToken);
    setUser(result.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), loginWithOAuth, logout }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
