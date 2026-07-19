'use client';

import { useEffect, useState } from 'react';
import { AppointmentStatus, LoyaltyTier, Paginated } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import { useSelectedTenant } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge, TierBadge } from '@/components/ui';
import { ThemeToggle } from '@/components/theme-toggle';

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
    <div style={{ padding: '24px 18px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <BarberAvatar nome={user?.nome ?? '?'} size={60} />
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{perfil?.nome ?? user?.nome}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>{user?.email}</p>
          {perfil?.telefone && <p className="muted mono" style={{ margin: '2px 0 0', fontSize: 13 }}>{perfil.telefone}</p>}
        </div>
      </header>

      {/* Fidelidade */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong>Fidelidade</strong>
          {prog && <TierBadge tier={prog.tier} />}
        </div>
        <div className="progress-track" style={{ marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {prog && (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            <span className="mono">{prog.pontosAtuais}/{prog.meta}</span> pts · faltam <span className="mono">{prog.faltam}</span> pts para um serviço grátis
          </p>
        )}
      </div>

      {/* Histórico */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Histórico</h3>
      {hist.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
          <p className="muted" style={{ margin: 0 }}>Você ainda não tem agendamentos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {hist.map((a) => (
            <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 }}>
              <div>
                <strong>{a.servicos.map((s) => s.nome).join(', ')}</strong>
                <p className="muted" style={{ margin: '4px 0', fontSize: 13 }}>
                  {a.barbeiro.user.nome} · {formatDateTime(a.dataHora)}
                </p>
                <span className="mono" style={{ color: 'var(--brass-light)', fontSize: 14 }}>{brl(Number(a.valorTotal))}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
          {hist.length < histTotal && (
            <button
              className="btn-outline"
              onClick={carregarMais}
              disabled={loadingMore}
              style={{ width: '100%' }}
            >
              {loadingMore
                ? 'Carregando…'
                : `Carregar mais (${histTotal - hist.length} restantes)`}
            </button>
          )}
        </div>
      )}

      {/* Menu Conta */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Conta</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          role="button"
          onClick={abrirEdicao}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span>Editar perfil</span>
          <span className="muted" style={{ fontSize: 18 }}>›</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span>Formas de pagamento</span>
          <span className="muted mono" style={{ fontSize: 11 }}>em breve</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <span>Tema escuro</span>
          <ThemeToggle />
        </div>
        <div
          role="button"
          onClick={logout}
          style={{ padding: '14px 16px', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sair
        </div>
      </div>

      {/* Modal Editar perfil */}
      {editing && (
        <div
          onClick={() => setEditing(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 60 }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            className="card card-raised"
            style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>Editar perfil</h3>
            <div className="barber-rule" style={{ width: 48 }} />
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required minLength={2} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 90000-0000" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" value={perfil?.email ?? user?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>A edição de e-mail chega junto com as notificações.</p>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn-primary" style={{ width: 'auto' }} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
