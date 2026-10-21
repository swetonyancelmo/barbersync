'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { brl } from '@/lib/format';
import { IconTag, IconPlus } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracaoMin: number;
  preco: number;
}

const EMPTY = { nome: '', descricao: '', duracaoMin: 30, preco: 0 };

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [alvo, setAlvo] = useState<Servico | null>(null);

  const load = useCallback(async () => {
    setServicos(await api<Servico[]>('/services'));
  }, []);
  useEffect(() => { load().catch(() => setServicos([])); }, [load]);

  function abrirNovo() {
    setForm(EMPTY); setEditId(null); setError(null); setOpen(true);
  }
  function abrirEdicao(s: Servico) {
    setForm({ nome: s.nome, descricao: s.descricao ?? '', duracaoMin: s.duracaoMin, preco: Number(s.preco) });
    setEditId(s.id); setError(null); setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      duracaoMin: Number(form.duracaoMin),
      preco: Number(form.preco),
    };
    try {
      if (editId) await api(`/services/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/services', { method: 'POST', body: JSON.stringify(body) });
      setOpen(false);
      toast.success(editId ? 'Serviço atualizado.' : 'Serviço criado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function remover() {
    if (!alvo) return;
    const id = alvo.id;
    setAlvo(null);
    try {
      await api(`/services/${id}`, { method: 'DELETE' });
      toast.success('Serviço removido.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao remover.');
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="m-0 text-[28px]">Serviços</h1>
        <Button onClick={abrirNovo}><IconPlus size={18} /> Novo serviço</Button>
      </div>
      <div className="barber-rule mb-[22px] w-[60px]" />

      {servicos === null ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[130px] rounded-card" />)}
        </div>
      ) : servicos.length === 0 ? (
        <Card className="flex flex-col items-center gap-2.5 p-9 text-center">
          <span className="text-slate"><IconTag size={28} /></span>
          <p className="text-slate">Nenhum serviço cadastrado. Comece adicionando um.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
          {servicos.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <strong className="text-base">{s.nome}</strong>
                  <p className="mt-1 text-[13px] text-slate">{s.descricao || '—'}</p>
                </div>
                <strong className="font-mono text-verd">{brl(Number(s.preco))}</strong>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="pending" className="font-mono">{s.duracaoMin} min</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirEdicao(s)}>Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => setAlvo(s)}>Remover</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-[440px] overflow-y-auto">
          <form onSubmit={salvar} className="flex flex-col gap-3.5">
            <DialogHeader>
              <DialogTitle>{editId ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
              <DialogDescription className="sr-only">Preencha os dados do serviço oferecido pela barbearia.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="s-nome">Nome</Label>
              <Input id="s-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Descrição</Label>
              <Textarea id="s-desc" rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="s-dur">Duração (min)</Label>
                <Input id="s-dur" className="font-mono" type="number" min={1} value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} required />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="s-preco">Preço (R$)</Label>
                <Input id="s-preco" className="font-mono" type="number" min={0} step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} required />
              </div>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={alvo !== null} onOpenChange={(o) => !o && setAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
            <AlertDialogDescription>
              {alvo ? `“${alvo.nome}” será removido do catálogo.` : ''}
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
