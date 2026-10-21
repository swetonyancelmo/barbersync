'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus } from '@barbersync/shared';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { brl, hora } from '@/lib/format';
import { StatusBadge } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      api<Agendamento[]>('/appointments/pendentes'),
      api<Agendamento[]>('/appointments/respondidas'),
    ]);
    setPendentes(p);
    setRespondidas(r);
    setCarregando(false);
  }, []);

  useEffect(() => { load().catch(() => { setErro('Falha ao carregar as solicitações.'); setCarregando(false); }); }, [load]);

  async function responder(id: string, acao: 'confirmar' | 'recusar') {
    setErro(null);
    try {
      await api(`/appointments/${id}/${acao}`, { method: 'PATCH' });
      toast.success(acao === 'confirmar' ? 'Solicitação confirmada.' : 'Solicitação recusada.');
      // Avisa o layout para atualizar o contador de pendentes da sidebar.
      window.dispatchEvent(new Event('bs:pendentes-changed'));
      await load();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao responder a solicitação.');
    }
  }

  return (
    <div>
      <h1 className="mb-2 mt-0 text-[28px]">Solicitações</h1>
      <div className="barber-rule mb-5 w-[60px]" />

      {erro && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <h3 className="text-lg">Aguardando resposta</h3>
      {carregando ? (
        <div className="mb-7 space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : pendentes.length === 0 ? (
        !erro && (
          <Card className="mb-7 p-5 text-center">
            <p className="m-0 text-slate">Tudo em dia — nenhuma solicitação aguardando resposta.</p>
          </Card>
        )
      ) : (
        <div className="mb-7 flex flex-col gap-3">
          {pendentes.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <strong>{a.cliente.nome}</strong>
                <p className="my-1 text-sm text-slate">
                  {a.servicos.map((s) => s.nome).join(', ')} · {a.barbeiro.user.nome}
                </p>
                <span className="text-sm">
                  {new Date(a.dataHora).toLocaleDateString('pt-BR')} · {hora(a.dataHora)} · {brl(Number(a.valorTotal))}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => responder(a.id, 'recusar')}>Recusar</Button>
                <Button variant="success" size="sm" onClick={() => responder(a.id, 'confirmar')}>Confirmar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h3 className="text-lg">Respondidas recentemente</h3>
      {respondidas.length === 0 ? (
        <p className="text-sm text-slate">Nada por aqui ainda.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {respondidas.map((a) => (
            <Card key={a.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <strong>{a.cliente.nome}</strong>
                <p className="mt-0.5 text-[13px] text-slate">
                  {a.servicos.map((s) => s.nome).join(', ')} · {new Date(a.dataHora).toLocaleDateString('pt-BR')} {hora(a.dataHora)}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
