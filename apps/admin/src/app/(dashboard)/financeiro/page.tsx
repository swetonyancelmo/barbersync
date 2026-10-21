'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus, PaymentMethod } from '@barbersync/shared';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { brl, hora, isoDate } from '@/lib/format';
import { KpiCard, PaidBadge } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = isoDate(date);
    const [lista, k] = await Promise.all([
      api<Item[]>(`/payments/day?data=${data}`),
      api<typeof kpis>(`/payments/kpis?data=${data}`),
    ]);
    setItens(lista);
    setKpis(k);
    setCarregando(false);
  }, [date]);

  useEffect(() => { load().catch(() => { setErro('Falha ao carregar os atendimentos.'); setCarregando(false); }); }, [load]);

  async function registrar(agendamentoId: string) {
    setErro(null);
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify({ agendamentoId, forma }) });
      setExpandido(null);
      toast.success('Recebimento registrado.');
      await load();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Falha ao registrar pagamento.');
    }
  }

  return (
    <div>
      <h1 className="mb-2 mt-0 text-[28px]">Financeiro</h1>
      <div className="barber-rule mb-5 w-[60px]" />

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <KpiCard label="Recebido hoje" value={brl(kpis.recebido)} valueClassName="text-ok" />
        <KpiCard label="A receber hoje" value={brl(kpis.aReceber)} valueClassName="text-verd" />
        <KpiCard label="Ticket médio" value={brl(kpis.ticketMedio)} />
        <KpiCard label="Atendimentos hoje" value={kpis.atendimentos} />
      </div>

      <Card>
        {carregando ? (
          <div className="space-y-3 p-5" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : itens.length === 0 ? (
          !erro && <p className="p-6 text-center text-slate">Nenhum atendimento hoje.</p>
        ) : (
          itens
            .filter((i) => i.agendamento.status !== AppointmentStatus.RECUSADO)
            .map((i) => (
              <div key={i.agendamento.id} className="border-b border-line-soft p-4 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <strong>{i.agendamento.cliente.nome}</strong>
                    <p className="mt-0.5 text-[13px] text-slate">
                      {hora(i.agendamento.dataHora)} · {i.agendamento.servicos.map((s) => s.nome).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className="mono text-verd">{brl(Number(i.agendamento.valorTotal))}</strong>
                    {i.pagamento ? (
                      <PaidBadge forma={i.pagamento.forma} />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-expanded={expandido === i.agendamento.id}
                        onClick={() => { setExpandido(expandido === i.agendamento.id ? null : i.agendamento.id); setErro(null); }}
                      >
                        Registrar pagamento
                      </Button>
                    )}
                  </div>
                </div>

                {/* Seletor inline de forma de pagamento */}
                {expandido === i.agendamento.id && !i.pagamento && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={forma}
                      onValueChange={(v) => v && setForma(v as PaymentMethod)}
                      aria-label="Forma de pagamento"
                    >
                      {FORMAS.map((f) => (
                        <ToggleGroupItem key={f.value} value={f.value}>{f.label}</ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <Button size="sm" onClick={() => registrar(i.agendamento.id)}>
                      Confirmar recebimento
                    </Button>
                  </div>
                )}
              </div>
            ))
        )}
      </Card>
      {erro && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
