'use client';

import { useEffect, useState } from 'react';
import { AppointmentStatus, LoyaltyTier, Paginated } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { useSelectedTenant } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge, TierBadge } from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Progresso {
  pontosAtuais: number;
  meta: number;
  faltam: number;
  tier: LoyaltyTier;
  totalGastoHistorico: number;
}
interface Agendamento {
  id: string;
  dataHora: string;
  status: AppointmentStatus;
  valorTotal: number;
  barbeiro: { user: { nome: string } };
  servicos: { nome: string }[];
}

interface Perfil {
  nome: string;
  email: string;
  telefone: string | null;
}

export default function PerfilPage() {
  const { user, updateUser, logout } = useAuth();
  const { tenantId } = useSelectedTenant();
  const [prog, setProg] = useState<Progresso | null>(null);
  const [hist, setHist] = useState<Agendamento[]>([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage, setHistPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Editar perfil
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const HIST_LIMIT = 10;

  useEffect(() => {
    api<Paginated<Agendamento>>(`/appointments/me?page=1&limit=${HIST_LIMIT}`)
      .then((p) => {
        setHist(p.items);
        setHistTotal(p.total);
        setHistPage(1);
      })
      .catch(() => setHist([]));
    api<Perfil>('/users/me').then(setPerfil).catch(() => setPerfil(null));
  }, []);

  async function carregarMais() {
    setLoadingMore(true);
    try {
      const next = histPage + 1;
      const p = await api<Paginated<Agendamento>>(`/appointments/me?page=${next}&limit=${HIST_LIMIT}`);
      setHist((atual) => [...atual, ...p.items]);
      setHistTotal(p.total);
      setHistPage(next);
    } catch {
      /* mantém o que já está na tela */
    } finally {
      setLoadingMore(false);
    }
  }

  function abrirEdicao() {
    setForm({ nome: perfil?.nome ?? user?.nome ?? '', telefone: perfil?.telefone ?? '' });
    setError(null);
    setEditing(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Perfil>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ nome: form.nome, telefone: form.telefone }),
      });
      setPerfil(updated);
      updateUser({ nome: updated.nome }); // reflete no header/saudações
      setEditing(false);
      toast.success('Perfil atualizado.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!tenantId) return;
    api<Progresso>(`/loyalty/me?tenantId=${tenantId}`).then(setProg).catch(() => setProg(null));
  }, [tenantId]);

  const pct = prog ? Math.min(100, (prog.pontosAtuais / prog.meta) * 100) : 0;

  return (
    <div className="px-[18px] py-6">
      <header className="mb-[22px] flex items-center gap-3.5">
        <BarberAvatar nome={user?.nome ?? '?'} size={60} />
        <div>
          <h1 className="text-2xl">{perfil?.nome ?? user?.nome}</h1>
          <p className="text-sm text-slate">{user?.email}</p>
          {perfil?.telefone && <p className="mono mt-0.5 text-[13px] text-slate">{perfil.telefone}</p>}
        </div>
      </header>

      {/* Fidelidade */}
      <Card className="mb-6 p-6">
        <div className="mb-3 flex items-center justify-between">
          <strong>Fidelidade</strong>
          {prog && <TierBadge tier={prog.tier} />}
        </div>
        <Progress value={pct} aria-label="Progresso de fidelidade" className="mb-2" />
        {prog && (
          <p className="text-[13px] text-slate">
            <span className="mono">{prog.pontosAtuais}/{prog.meta}</span> pts · faltam <span className="mono">{prog.faltam}</span> pts para um serviço grátis
          </p>
        )}
      </Card>

      {/* Histórico */}
      <h3 className="mb-2.5 text-lg">Histórico</h3>
      {hist.length === 0 ? (
        <Card className="mb-6 p-6 text-center">
          <p className="text-slate">Você ainda não tem agendamentos.</p>
        </Card>
      ) : (
        <div className="mb-6 flex flex-col gap-2.5">
          {hist.map((a) => (
            <Card key={a.id} className="flex items-start justify-between p-3.5">
              <div>
                <strong>{a.servicos.map((s) => s.nome).join(', ')}</strong>
                <p className="my-1 text-[13px] text-slate">
                  {a.barbeiro.user.nome} · {formatDateTime(a.dataHora)}
                </p>
                <span className="mono text-sm text-verd">{brl(Number(a.valorTotal))}</span>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
          {hist.length < histTotal && (
            <Button variant="outline" className="w-full" onClick={carregarMais} disabled={loadingMore}>
              {loadingMore
                ? 'Carregando…'
                : `Carregar mais (${histTotal - hist.length} restantes)`}
            </Button>
          )}
        </div>
      )}

      {/* Menu Conta */}
      <h3 className="mb-2.5 text-lg">Conta</h3>
      <Card className="overflow-hidden">
        <Button
          variant="ghost"
          className="h-auto w-full justify-between rounded-none px-4 py-3.5 text-[15px] font-normal text-ink"
          onClick={abrirEdicao}
        >
          <span>Editar perfil</span>
          <span className="text-lg text-slate" aria-hidden="true">›</span>
        </Button>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3.5">
          <span>Formas de pagamento</span>
          <span className="mono text-[11px] text-slate">em breve</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-2.5">
          <span>Tema escuro</span>
          <ThemeToggle />
        </div>
        <Separator />
        <Button
          variant="ghost"
          className="h-auto w-full justify-start rounded-none px-4 py-3.5 text-[15px] font-semibold text-danger hover:bg-danger/10 hover:text-danger"
          onClick={logout}
        >
          Sair
        </Button>
      </Card>

      {/* Modal Editar perfil */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-[420px]">
          <form onSubmit={salvar} className="flex flex-col gap-3.5">
            <DialogHeader>
              <DialogTitle>Editar perfil</DialogTitle>
              <DialogDescription className="sr-only">Atualize seu nome e telefone.</DialogDescription>
            </DialogHeader>
            <div className="barber-rule w-12" />
            <div>
              <Label htmlFor="edit-nome">Nome</Label>
              <Input id="edit-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} />
            </div>
            <div>
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input id="edit-telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 90000-0000" />
            </div>
            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input id="edit-email" value={perfil?.email ?? user?.email ?? ''} disabled />
              <p className="mt-1.5 text-xs text-slate">A edição de e-mail chega junto com as notificações.</p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
