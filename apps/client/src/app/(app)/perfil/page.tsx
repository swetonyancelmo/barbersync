'use client';

import { useEffect, useState } from 'react';
import { AppointmentStatus, LoyaltyTier } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useSelectedTenant } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge, TierBadge } from '@/components/ui';

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

const CONTA = ['Editar perfil', 'Formas de pagamento', 'Notificações'];

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const { tenantId } = useSelectedTenant();
  const [prog, setProg] = useState<Progresso | null>(null);
  const [hist, setHist] = useState<Agendamento[]>([]);

  useEffect(() => {
    api<Agendamento[]>('/appointments/me').then(setHist).catch(() => setHist([]));
  }, []);

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
          <h1 style={{ margin: 0, fontSize: 24 }}>{user?.nome}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>{user?.email}</p>
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
        </div>
      )}

      {/* Menu Conta */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Conta</h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {CONTA.map((item) => (
          <div key={item} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            {item}
          </div>
        ))}
        <div
          role="button"
          onClick={logout}
          style={{ padding: '14px 16px', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}
        >
          Sair
        </div>
      </div>
    </div>
  );
}
