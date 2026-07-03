'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus, PaymentMethod } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { brl, dataLonga, hora, isoDate } from '@/lib/format';
import { PaidBadge, StatusBadge } from '@/components/ui';

interface Agendamento {
  id: string;
  dataHora: string;
  status: AppointmentStatus;
  valorTotal: number;
  cliente: { nome: string };
  barbeiro: { user: { nome: string } };
  servicos: { nome: string }[];
}
interface DayItem {
  agendamento: Agendamento;
  pagamento: { forma: PaymentMethod; valor: number } | null;
}

const FORMAS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.PIX, label: 'Pix' },
  { value: PaymentMethod.CARTAO, label: 'Cartão' },
  { value: PaymentMethod.DINHEIRO, label: 'Dinheiro' },
];

export default function AgendaPage() {
  const [date, setDate] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [itens, setItens] = useState<DayItem[]>([]);
  const [kpis, setKpis] = useState({ recebido: 0, atendimentos: 0 });
  const [ativos, setAtivos] = useState(0);

  // Estado do popover de pagamento (qual agendamento + forma escolhida)
  const [payFor, setPayFor] = useState<string | null>(null);
  const [forma, setForma] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = isoDate(date);
    const [dia, k, barbers] = await Promise.all([
      api<DayItem[]>(`/payments/day?data=${data}`),
      api<{ recebido: number; atendimentos: number }>(`/payments/kpis?data=${data}`),
      api<{ ativo: boolean }[]>(`/barbers`),
    ]);
    setItens(dia);
    setKpis(k);
    setAtivos(barbers.filter((b) => b.ativo).length);
  }, [date]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const shift = (days: number) => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });

  async function registrar(agendamentoId: string) {
    setError(null);
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify({ agendamentoId, forma }) });
      setPayFor(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao registrar pagamento.');
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Agenda</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      {/* Navegação de data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn-outline" onClick={() => shift(-1)}>◀</button>
        <button className="btn-outline" onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setDate(d); }}>Hoje</button>
        <button className="btn-outline" onClick={() => shift(1)}>▶</button>
        <span className="muted" style={{ textTransform: 'capitalize' }}>{dataLonga(date)}</span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="kpi"><p className="kpi-label">Atendimentos hoje</p><div className="kpi-value">{kpis.atendimentos}</div></div>
        <div className="kpi"><p className="kpi-label">Faturado hoje</p><div className="kpi-value" style={{ color: 'var(--brass-light)' }}>{brl(kpis.recebido)}</div></div>
        <div className="kpi"><p className="kpi-label">Barbeiros ativos</p><div className="kpi-value">{ativos}</div></div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0 }}>
        {itens.length === 0 ? (
          <p className="muted" style={{ padding: 24, textAlign: 'center' }}>Nenhum agendamento neste dia.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Hora</th><th>Cliente</th><th>Serviço</th><th>Barbeiro</th><th>Valor</th><th>Status</th><th>Pagamento</th></tr>
              </thead>
              <tbody>
                {itens.map(({ agendamento: a, pagamento }) => {
                  const recusado = a.status === AppointmentStatus.RECUSADO;
                  return (
                    <tr key={a.id}>
                      <td className="mono" style={{ color: 'var(--brass-light)' }}>{hora(a.dataHora)}</td>
                      <td>{a.cliente.nome}</td>
                      <td>{a.servicos.map((s) => s.nome).join(', ')}</td>
                      <td>{a.barbeiro.user.nome}</td>
                      <td className="mono">{brl(Number(a.valorTotal))}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td style={{ minWidth: 200 }}>
                        {pagamento ? (
                          <PaidBadge forma={pagamento.forma} />
                        ) : recusado ? (
                          <span className="muted" style={{ fontSize: 13 }}>—</span>
                        ) : payFor === a.id ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            {FORMAS.map((f) => (
                              <button
                                key={f.value}
                                onClick={() => setForma(f.value)}
                                className="btn-outline"
                                style={{ padding: '5px 10px', fontSize: 12, borderColor: forma === f.value ? 'var(--brass)' : 'var(--oak)', color: forma === f.value ? 'var(--brass-light)' : 'var(--bone)' }}
                              >
                                {f.label}
                              </button>
                            ))}
                            <button className="btn-primary" style={{ width: 'auto', padding: '5px 12px', fontSize: 12 }} onClick={() => registrar(a.id)}>Confirmar</button>
                            <button className="btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setPayFor(null)}>Cancelar</button>
                          </div>
                        ) : (
                          <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => { setPayFor(a.id); setForma(PaymentMethod.PIX); setError(null); }}>
                            Marcar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
    </div>
  );
}
