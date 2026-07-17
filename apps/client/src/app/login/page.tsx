'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { IconRazor } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.senha);
      } else {
        await register(form);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', minHeight: '100dvh', justifyContent: 'center', maxWidth: 440, margin: '0 auto', width: '100%' }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', color: 'var(--brass)', marginBottom: 6 }}>
          <IconRazor size={40} />
        </div>
        <h1 style={{ fontSize: 40, margin: '4px 0 10px', letterSpacing: 0.5 }}>BarberSync</h1>
        <div className="barber-rule" style={{ width: 72, margin: '0 auto 14px' }} />
        <p className="muted" style={{ margin: 0 }}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </p>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' && (
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.nome} onChange={set('nome')} required />
          </div>
        )}
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required />
        </div>
        {mode === 'signup' && (
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={set('telefone')} required />
          </div>
        )}
        <div>
          <label className="label">Senha</label>
          <input className="input" type="password" value={form.senha} onChange={set('senha')} required />
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>
        )}

        <button className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>

      <p className="muted" style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
        <a
          role="button"
          onClick={() => {
            setError(null);
            setMode(mode === 'login' ? 'signup' : 'login');
          }}
          style={{ cursor: 'pointer' }}
        >
          {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
        </a>
      </p>
    </div>
  );
}
