'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { IconScissors } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[400px]">
        <div className="mb-[30px] text-center">
          <div className="mb-1.5 inline-flex text-brass">
            <IconScissors size={38} />
          </div>
          <h1 className="mb-2.5 mt-1 text-4xl tracking-[0.5px]">BarberSync</h1>
          <div className="barber-rule mx-auto mb-3.5 w-[68px]" />
          <p className="m-0 text-slate">
            {mode === 'login' ? 'Acesse seu painel' : 'Cadastre sua barbearia'}
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <>
              <div>
                <Label htmlFor="nomeBarbearia">Nome da barbearia</Label>
                <Input id="nomeBarbearia" value={form.nomeBarbearia} onChange={set('nomeBarbearia')} required />
              </div>
              <div>
                <Label htmlFor="nomeAdmin">Seu nome</Label>
                <Input id="nomeAdmin" value={form.nomeAdmin} onChange={set('nomeAdmin')} required />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" value={form.senha} onChange={set('senha')} required />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button disabled={loading} className="mt-1.5 w-full">
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar barbearia'}
          </Button>
        </form>

        <p className="mt-[22px] text-center text-sm text-slate">
          {mode === 'login' ? 'Ainda não tem conta? ' : 'Já tem uma barbearia? '}
          <button
            type="button"
            className="font-semibold text-pole hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Cadastre sua barbearia' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
