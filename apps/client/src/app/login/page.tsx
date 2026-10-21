'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { IconRazor } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-6 py-12">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <div className="mb-1.5 inline-flex text-brass">
          <IconRazor size={40} />
        </div>
        <h1 className="mb-2.5 mt-1 text-[40px] tracking-[0.5px]">BarberSync</h1>
        <div className="barber-rule mx-auto mb-3.5 w-[72px]" />
        <p className="text-slate">{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {mode === 'signup' && (
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={form.nome} onChange={set('nome')} required />
          </div>
        )}
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={form.email} onChange={set('email')} required />
        </div>
        {mode === 'signup' && (
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" value={form.telefone} onChange={set('telefone')} required />
          </div>
        )}
        <div>
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" value={form.senha} onChange={set('senha')} required />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button className="mt-2 w-full" disabled={loading}>
          {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Cadastrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={() => {
            setError(null);
            setMode(mode === 'login' ? 'signup' : 'login');
          }}
        >
          {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
        </Button>
      </p>
    </div>
  );
}
