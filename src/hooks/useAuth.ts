import { useState, useCallback } from 'react';
import { getStoredUser, clearAuth, apiFetch, saveAuth } from '../lib/api';

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('workpro_token');
}

export interface User {
  uid: string;
  username: string;
  role: string;
  avatar?: string;
  bio?: string;
  skills?: string | string[];
  balance_connects?: number;
  total_jobs_completed?: number;
  total_jobs_posted?: number;
  is_blocked?: boolean;
  terms_accepted?: boolean;
  terms_accepted_at?: string;
}

export function useAuth() {
  const [user, setUserState] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) saveAuth(localStorage.getItem('workpro_token') || '', u);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUserState(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('workpro_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUserState(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = getStoredUser();
    if (!stored?.uid) return;
    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/me');
      if (data?.user) {
        saveAuth(localStorage.getItem('workpro_token') || '', data.user);
        setUserState(data.user);
      } else if (data?.uid) {
        saveAuth(localStorage.getItem('workpro_token') || '', data);
        setUserState(data);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  return { user, loading, setUser, updateUser, logout, refreshUser };
}
