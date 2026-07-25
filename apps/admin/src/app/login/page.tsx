'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { IconScissors } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const { login, registerBarbearia } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({
    nomeBarbearia: '',
    nomeAdmin: '',
    email: '',
    senha: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Abre direto em "cadastro" quando vindo da landing (?cadastro=1).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cadastro') === '1') setMode('signup');
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.senha);
      else await registerBarbearia(form);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ display: 'inline-flex', color: 'var(--brass)', marginBottom: 6 }}>
            <IconScissors size={38} />
          </div>
          <h1 style={{ fontSize: 36, margin: '4px 0 10px', letterSpacing: 0.5 }}>BarberSync</h1>
          <div className="barber-rule" style={{ width: 68, margin: '0 auto 14px' }} />
          <p className="muted" style={{ margin: 0 }}>
            {mode === 'login' ? 'Acesse seu painel' : 'Cadastre sua barbearia'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <>
              <div>
                <label className="label">Nome da barbearia</label>
                <input className="input" value={form.nomeBarbearia} onChange={set('nomeBarbearia')} required />
              </div>
              <div>
                <label className="label">Seu nome</label>
                <input className="input" value={form.nomeAdmin} onChange={set('nomeAdmin')} required />
              </div>
            </>
          )}
          <div>
            <label className="label">E-mail</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="password" value={form.senha} onChange={set('senha')} required />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}

          <button className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar barbearia'}
          </button>
        </form>

        <p className="muted" style={{ textAlign: 'center', marginTop: 22, fontSize: 14 }}>
          {mode === 'login' ? 'Ainda não tem conta? ' : 'Já tem uma barbearia? '}
          <a
            role="button"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Cadastre sua barbearia' : 'Entrar'}
          </a>
        </p>
      </div>
    </div>
  );
}
