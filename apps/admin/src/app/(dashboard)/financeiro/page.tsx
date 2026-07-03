'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus, PaymentMethod } from '@barbersync/shared';
import { api } from '@/lib/api';
import { brl, hora, isoDate } from '@/lib/format';
import { PaidBadge } from '@/components/ui';

interface Item {
  agendamento: {
    id: string;
    dataHora: string;
    status: AppointmentStatus;
    valorTotal: number;
    cliente: { nome: string };
    servicos: { nome: string }[];
  };
  pagamento: { forma: PaymentMethod; valor: number } | null;
}

const FORMAS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.PIX, label: 'Pix' },
  { value: PaymentMethod.CARTAO, label: 'Cartão' },
  { value: PaymentMethod.DINHEIRO, label: 'Dinheiro' },
];

export default function FinanceiroPage() {
  const [date] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [itens, setItens] = useState<Item[]>([]);
  const [kpis, setKpis] = useState({ recebido: 0, aReceber: 0, ticketMedio: 0, atendimentos: 0 });
  const [expandido, setExpandido] = useState<string | null>(null);
  const [forma, setForma] = useState<PaymentMethod>(PaymentMethod.PIX);

  const load = useCallback(async () => {
    const data = isoDate(date);
    const [lista, k] = await Promise.all([
      api<Item[]>(`/payments/day?data=${data}`),
      api<typeof kpis>(`/payments/kpis?data=${data}`),
    ]);
    setItens(lista);
    setKpis(k);
  }, [date]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  async function registrar(agendamentoId: string) {
    await api('/payments', { method: 'POST', body: JSON.stringify({ agendamentoId, forma }) });
    setExpandido(null);
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Financeiro</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="kpi"><p className="kpi-label">Recebido hoje</p><div className="kpi-value" style={{ color: 'var(--success)' }}>{brl(kpis.recebido)}</div></div>
        <div className="kpi"><p className="kpi-label">A receber hoje</p><div className="kpi-value" style={{ color: 'var(--gold-2)' }}>{brl(kpis.aReceber)}</div></div>
        <div className="kpi"><p className="kpi-label">Ticket médio</p><div className="kpi-value">{brl(kpis.ticketMedio)}</div></div>
        <div className="kpi"><p className="kpi-label">Atendimentos hoje</p><div className="kpi-value">{kpis.atendimentos}</div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {itens.length === 0 ? (
          <p className="muted" style={{ padding: 24, textAlign: 'center' }}>Nenhum atendimento hoje.</p>
        ) : (
          itens
            .filter((i) => i.agendamento.status !== AppointmentStatus.RECUSADO)
            .map((i) => (
              <div key={i.agendamento.id} style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{i.agendamento.cliente.nome}</strong>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                      {hora(i.agendamento.dataHora)} · {i.agendamento.servicos.map((s) => s.nome).join(', ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong className="mono" style={{ color: 'var(--brass-light)' }}>{brl(Number(i.agendamento.valorTotal))}</strong>
                    {i.pagamento ? (
                      <PaidBadge forma={i.pagamento.forma} />
                    ) : (
                      <button className="btn-outline" onClick={() => setExpandido(expandido === i.agendamento.id ? null : i.agendamento.id)}>
                        Registrar pagamento
                      </button>
                    )}
                  </div>
                </div>

                {/* Seletor inline de forma de pagamento */}
                {expandido === i.agendamento.id && !i.pagamento && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                    {FORMAS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setForma(f.value)}
                        className="btn-outline"
                        style={{
                          borderColor: forma === f.value ? 'var(--gold-1)' : 'var(--border)',
                          color: forma === f.value ? 'var(--gold-2)' : 'var(--text)',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button className="btn-primary" onClick={() => registrar(i.agendamento.id)}>
                      Confirmar recebimento
                    </button>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
