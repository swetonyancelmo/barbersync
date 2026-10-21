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
  /** `next`: caminho interno para onde voltar (ex.: /<slug>/agendar). */
  login: (email: string, senha: string, next?: string) => Promise<void>;
  register: (
    data: { nome: string; email: string; senha: string; telefone: string },
    next?: string,
  ) => Promise<void>;
  updateUser: (partial: Partial<SessionUser>) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

/** Só aceita caminho interno (evita open redirect via ?next=https://…). */
export function safeNext(next?: string | null): string {
  // "//x" e "/\x" viram URL de outro host no navegador.
  return next && next.startsWith('/') && !/^\/[/\\]/.test(next) ? next : '/home';
}

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
    async (email: string, senha: string, next?: string) => {
      const res = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      handleAuth(res);
      router.push(safeNext(next));
    },
    [handleAuth, router],
  );

  const register = useCallback(
    async (
      data: { nome: string; email: string; senha: string; telefone: string },
      next?: string,
    ) => {
      const res = await api<AuthResponse>('/auth/register/cliente', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      handleAuth(res);
      router.push(safeNext(next));
    },
    [handleAuth, router],
  );

  const updateUser = useCallback((partial: Partial<SessionUser>) => {
    setUser((cur) => (cur ? { ...cur, ...partial } : cur));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <Ctx.Provider value={{ user, loading, login, register, updateUser, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
