'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { AuthResponse } from '@barbersync/shared';
import { api, clearToken, getToken, setToken } from './api';

type SessionUser = AuthResponse['user'];

interface AuthCtx {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registerBarbearia: (data: {
    nomeBarbearia: string;
    nomeAdmin: string;
    email: string;
    senha: string;
  }) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<SessionUser>('/users/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((res: AuthResponse) => {
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (email: string, senha: string) => {
      const res = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      handleAuth(res);
      router.push('/agenda');
    },
    [handleAuth, router],
  );

  const registerBarbearia = useCallback(
    async (data: { nomeBarbearia: string; nomeAdmin: string; email: string; senha: string }) => {
      const res = await api<AuthResponse>('/auth/register/barbearia', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      handleAuth(res);
      router.push('/agenda');
    },
    [handleAuth, router],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <Ctx.Provider value={{ user, loading, login, registerBarbearia, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
