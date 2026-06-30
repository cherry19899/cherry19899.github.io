import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { OWNER_USERNAME } from '../lib/constants';
import { initPiSdk } from '../lib/pi';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    try {
      const raw = localStorage.getItem('workpro_user');
      if (raw) {
        const u: User = JSON.parse(raw);
        if (u?.uid) {
          if (u.username?.toLowerCase() === OWNER_USERNAME) u.role = 'admin';
          setUser(u);
        }
      }
    } catch {}
    setLoading(false);

    // Kick off Pi SDK init (no-op in regular browser)
    initPiSdk();
  }, []);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updated };
      localStorage.setItem('workpro_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('workpro_user');
    localStorage.removeItem('workpro_token');
    localStorage.removeItem('workpro_jwt');
    localStorage.removeItem('workpro_uid');
    setUser(null);
  }, []);

  return { user, loading, setUser, updateUser, logout };
}
