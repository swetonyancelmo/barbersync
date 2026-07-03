'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppointmentStatus } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useSelectedTenant, TenantOption } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge } from '@/components/ui';
import { IconStar, IconReceipt } from '@/components/icons';

interface Barbeiro {
  id: string;
  especialidade: string | null;
  rating: number;
  user: { nome: string };
}
interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  preco: number;
}
interface Agendamento {
  id: string;
  dataHora: string;
  status: AppointmentStatus;
  valorTotal: number;
  barbeiro: { user: { nome: string } };
  servicos: { nome: string }[];
}

export default function HomePage() {
  const { user } = useAuth();
  const { tenantId, setTenantId } = useSelectedTenant();

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [proximo, setProximo] = useState<Agendamento | null>(null);
  const [pontos, setPontos] = useState<number>(0);

  useEffect(() => {
    api<TenantOption[]>('/tenants').then((list) => {
      setTenants(list);
      if (!tenantId && list[0]) setTenantId(list[0].id);
    });
    api<Agendamento | null>('/appointments/me/proximo').then(setProximo).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tenantId) return;
    api<Barbeiro[]>(`/barbers?tenantId=${tenantId}`).then(setBarbeiros).catch(() => setBarbeiros([]));
    api<Servico[]>(`/services?tenantId=${tenantId}`).then(setServicos).catch(() => setServicos([]));
    api<{ pontosAtuais: number }>(`/loyalty/me?tenantId=${tenantId}`)
      .then((r) => setPontos(r.pontosAtuais))
      .catch(() => setPontos(0));
  }, [tenantId]);

  return (
    <div style={{ padding: '24px 18px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <p className="muted" style={{ margin: 0, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Olá,</p>
          <h1 style={{ margin: 0, fontSize: 30 }}>{user?.nome?.split(' ')[0]}</h1>
        </div>
        <span className="badge badge-ouro"><IconStar size={13} /> <span className="mono">{pontos}</span> pts</span>
      </header>

      {/* Seletor de barbearia (cliente global) */}
      <label className="label">Barbearia</label>
      <select
        className="input"
        value={tenantId ?? ''}
        onChange={(e) => setTenantId(e.target.value)}
        style={{ marginBottom: 20 }}
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>{t.nome}</option>
        ))}
      </select>

      {/* Próximo agendamento — card em formato de comanda */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Próximo agendamento</h3>
      {proximo ? (
        <div className="ticket" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <strong style={{ fontSize: 16 }}>{proximo.servicos.map((s) => s.nome).join(', ')}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>com {proximo.barbeiro.user.nome}</p>
            </div>
            <StatusBadge status={proximo.status} />
          </div>
          <div className="ticket-perf" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 15, color: 'var(--brass-light)' }}>{formatDateTime(proximo.dataHora)}</span>
            <span className="mono" style={{ fontSize: 15 }}>{brl(Number(proximo.valorTotal))}</span>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28 }}>
          <span className="muted"><IconReceipt size={28} /></span>
          <p className="muted" style={{ margin: 0 }}>Você não tem agendamentos futuros.</p>
        </div>
      )}

      <Link href="/agendar">
        <button className="btn-primary" style={{ marginBottom: 28 }}>Reservar novo horário</button>
      </Link>

      {/* Barbeiros */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Nossos barbeiros</h3>
      {barbeiros.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>Nenhum barbeiro disponível nesta barbearia.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {barbeiros.map((b) => (
            <div key={b.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
              <BarberAvatar nome={b.user.nome} />
              <div style={{ flex: 1 }}>
                <strong>{b.user.nome}</strong>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>{b.especialidade ?? 'Barbeiro'}</p>
              </div>
              <span className="badge badge-ouro"><IconStar size={12} /> <span className="mono">{Number(b.rating).toFixed(1)}</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Serviços */}
      <h3 style={{ fontSize: 18, marginBottom: 10 }}>Serviços</h3>
      {servicos.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>Nenhum serviço cadastrado.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {servicos.map((s) => (
            <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: 14 }}>
              <div>
                <strong>{s.nome}</strong>
                <p className="muted mono" style={{ margin: 0, fontSize: 12 }}>{s.duracaoMin} min</p>
              </div>
              <strong className="mono" style={{ color: 'var(--brass-light)' }}>{brl(Number(s.preco))}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
