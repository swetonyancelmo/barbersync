'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { BarberAvatar } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Barbeiro {
  id: string;
  especialidade: string | null;
  rating: number;
  ativo: boolean;
  user: { nome: string; telefone: string | null };
}

const EMPTY = { nome: '', email: '', senha: '', especialidade: '', telefone: '' };

export default function EquipePage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Barbeiro aguardando confirmação de remoção
  const [alvo, setAlvo] = useState<Barbeiro | null>(null);

  const load = useCallback(async () => {
    const list = await api<Barbeiro[]>('/barbers');
    setBarbeiros(list.filter((b) => b.ativo));
  }, []);

  useEffect(() => { load().catch(() => setBarbeiros([])); }, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function abrirForm() {
    setForm(EMPTY);
    setError(null);
    setShowForm(true);
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/barbers', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY);
      setShowForm(false);
      toast.success('Barbeiro adicionado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao adicionar.');
    } finally {
      setSaving(false);
    }
  }

  async function remover() {
    if (!alvo) return;
    const id = alvo.id;
    setAlvo(null);
    try {
      await api(`/barbers/${id}`, { method: 'DELETE' });
      toast.success('Barbeiro removido.');
      await load();
    } catch (err) {
      // Ex.: barbeiro com agendamentos futuros — a API devolve a mensagem.
      toast.error(err instanceof ApiError ? err.message : 'Falha ao remover.');
    }
  }

  return (
    <div>
      <h1 className="mb-2 mt-0 text-[28px]">Equipe</h1>
      <div className="barber-rule mb-5 w-[60px]" />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5">
        {barbeiros === null &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[170px] rounded-card" />)}

        {barbeiros?.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <BarberAvatar nome={b.user.nome} size={52} />
              <div className="min-w-0">
                <strong className="block truncate">{b.user.nome}</strong>
                <p className="mt-0.5 text-[13px] text-slate">{b.especialidade ?? 'Barbeiro'}</p>
              </div>
            </div>
            <p className="mb-1.5 text-[13px] text-slate">{b.user.telefone ?? 'Sem telefone'}</p>
            <div className="flex items-center justify-between">
              <Badge variant="success">Ativo</Badge>
              <Button variant="danger" size="sm" onClick={() => setAlvo(b)}>Remover</Button>
            </div>
          </Card>
        ))}

        {barbeiros !== null && (
          <button
            type="button"
            onClick={abrirForm}
            className="flex min-h-[150px] items-center justify-center rounded-card border border-dashed border-line bg-tile font-semibold text-pole transition-colors hover:bg-tile-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
          >
            + Adicionar barbeiro
          </button>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[92vh] max-w-[420px] overflow-y-auto">
          <form onSubmit={adicionar} className="flex flex-col gap-3">
            <DialogHeader>
              <DialogTitle>Adicionar barbeiro</DialogTitle>
              <DialogDescription>Cria o acesso do barbeiro ao painel.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5"><Label htmlFor="b-nome">Nome</Label><Input id="b-nome" value={form.nome} onChange={set('nome')} required /></div>
            <div className="space-y-1.5"><Label htmlFor="b-esp">Especialidade</Label><Input id="b-esp" value={form.especialidade} onChange={set('especialidade')} /></div>
            <div className="space-y-1.5"><Label htmlFor="b-tel">Telefone</Label><Input id="b-tel" value={form.telefone} onChange={set('telefone')} /></div>
            <div className="space-y-1.5"><Label htmlFor="b-mail">E-mail (login)</Label><Input id="b-mail" type="email" autoComplete="off" value={form.email} onChange={set('email')} required /></div>
            <div className="space-y-1.5"><Label htmlFor="b-senha">Senha inicial</Label><Input id="b-senha" type="password" autoComplete="new-password" value={form.senha} onChange={set('senha')} required /></div>
            {error && (
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Adicionando…' : 'Adicionar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alvo !== null} onOpenChange={(o) => !o && setAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover barbeiro?</AlertDialogTitle>
            <AlertDialogDescription>
              {alvo?.user.nome} deixará de aparecer na equipe. Barbeiros com agendamentos futuros não podem ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remover}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
