import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sdd_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const t = localStorage.getItem('sdd_token');
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await auth.me();
      setUser(data);
    } catch {
      localStorage.removeItem('sdd_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (newToken: string) => {
    localStorage.setItem('sdd_token', newToken);
    setToken(newToken);
    try {
      const data = await auth.me();
      setUser(data);
    } catch {
      localStorage.removeItem('sdd_token');
      setToken(null);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sdd_token');
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
