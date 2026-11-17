import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, getToken, saveToken, setUnauthorizedHandler } from '../lib/api';
import type { UserSession } from '../types';

type AuthContextValue = {
  user: UserSession | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const invalidate = () => {
      clearToken();
      if (!active) return;
      setUser(null);
      navigate('/login', {
        state: { from: `${window.location.pathname}${window.location.search}` }, replace: true,
      });
    };
    setUnauthorizedHandler(invalidate);
    async function bootstrap() {
      try {
        if (getToken()) {
          const account = await api.me();
          if (active) setUser(account);
        }
      } catch {
        if (active) clearToken();
      } finally {
        if (active) setLoading(false);
      }
    }
    void bootstrap();
    return () => { active = false; setUnauthorizedHandler(null); };
  }, [navigate]);

  async function login(username: string, password: string) {
    const token = await api.login(username, password);
    saveToken(token);
    try {
      const account = await api.me();
      setUser(account);
    } catch (error) {
      clearToken();
      throw error;
    }
  }
  function logout() {
    clearToken();
    setUser(null);
    navigate('/login', { replace: true });
  }
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth exige AuthProvider');
  return context;
}

export function userDisplayName(user: UserSession | null): string {
  if (!user) return 'Atendente';
  return user.nome || user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || user.email || 'Atendente';
}
