'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus } from '@barbersync/shared';
import { api } from '@/lib/api';
import { brl, hora } from '@/lib/format';
import { StatusBadge } from '@/components/ui';

interface Agendamento {
  id: string;
  dataHora: string;
  status: AppointmentStatus;
  valorTotal: number;
  cliente: { nome: string };
  barbeiro: { user: { nome: string } };
  servicos: { nome: string }[];
}

export default function SolicitacoesPage() {
  const [pendentes, setPendentes] = useState<Agendamento[]>([]);
  const [respondidas, setRespondidas] = useState<Agendamento[]>([]);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      api<Agendamento[]>('/appointments/pendentes'),
      api<Agendamento[]>('/appointments/respondidas'),
    ]);
    setPendentes(p);
    setRespondidas(r);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  async function responder(id: string, acao: 'confirmar' | 'recusar') {
    await api(`/appointments/${id}/${acao}`, { method: 'PATCH' });
    await load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Solicitações</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      <h3 style={{ fontSize: 18 }}>Aguardando resposta</h3>
      {pendentes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', marginBottom: 28 }}>
          <p className="muted" style={{ margin: 0 }}>Tudo em dia — nenhuma solicitação aguardando resposta.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {pendentes.map((a) => (
            <div key={a.id} className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>{a.cliente.nome}</strong>
                <p className="muted" style={{ margin: '4px 0', fontSize: 14 }}>
                  {a.servicos.map((s) => s.nome).join(', ')} · {a.barbeiro.user.nome}
                </p>
                <span style={{ fontSize: 14 }}>
                  {new Date(a.dataHora).toLocaleDateString('pt-BR')} · {hora(a.dataHora)} · {brl(Number(a.valorTotal))}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-danger" onClick={() => responder(a.id, 'recusar')}>Recusar</button>
                <button className="btn-success" onClick={() => responder(a.id, 'confirmar')}>Confirmar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 18 }}>Respondidas recentemente</h3>
      {respondidas.length === 0 ? (
        <p className="muted" style={{ fontSize: 14 }}>Nada por aqui ainda.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {respondidas.map((a) => (
            <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
              <div>
                <strong>{a.cliente.nome}</strong>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
                  {a.servicos.map((s) => s.nome).join(', ')} · {new Date(a.dataHora).toLocaleDateString('pt-BR')} {hora(a.dataHora)}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
