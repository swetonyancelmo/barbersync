'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppointmentStatus, PaymentMethod } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { brl, dataLonga, hora, isoDate } from '@/lib/format';
import { toast } from 'sonner';
import { KpiCard, PaidBadge, StatusBadge } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
  const [carregando, setCarregando] = useState(true);

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
    setCarregando(false);
  }, [date]);

  useEffect(() => { load().catch(() => setCarregando(false)); }, [load]);

  const shift = (days: number) => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + days); return n; });

  async function registrar(agendamentoId: string) {
    setError(null);
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify({ agendamentoId, forma }) });
      setPayFor(null);
      toast.success('Pagamento registrado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao registrar pagamento.');
    }
  }

  return (
    <div>
      <h1 className="mb-2 mt-0 text-[28px]">Agenda</h1>
      <div className="barber-rule mb-5 w-[60px]" />

      {/* Navegação de data */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-2" role="group" aria-label="Navegar entre dias">
          <Button variant="outline" size="sm" aria-label="Dia anterior" onClick={() => shift(-1)}>◀</Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setDate(d); }}>Hoje</Button>
          <Button variant="outline" size="sm" aria-label="Próximo dia" onClick={() => shift(1)}>▶</Button>
        </div>
        <span className="capitalize text-slate">{dataLonga(date)}</span>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        <KpiCard label="Atendimentos hoje" value={kpis.atendimentos} />
        <KpiCard label="Faturado hoje" value={brl(kpis.recebido)} valueClassName="text-verd" />
        <KpiCard label="Barbeiros ativos" value={ativos} />
      </div>

      {/* Tabela */}
      <Card>
        {carregando ? (
          <div className="space-y-3 p-5" aria-busy="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : itens.length === 0 ? (
          <p className="p-6 text-center text-slate">Nenhum agendamento neste dia.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hora</TableHead><TableHead>Cliente</TableHead><TableHead>Serviço</TableHead>
                <TableHead>Barbeiro</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map(({ agendamento: a, pagamento }) => {
                const recusado = a.status === AppointmentStatus.RECUSADO;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="mono text-verd">{hora(a.dataHora)}</TableCell>
                    <TableCell>{a.cliente.nome}</TableCell>
                    <TableCell>{a.servicos.map((s) => s.nome).join(', ')}</TableCell>
                    <TableCell>{a.barbeiro.user.nome}</TableCell>
                    <TableCell className="mono">{brl(Number(a.valorTotal))}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="min-w-[200px]">
                      {pagamento ? (
                        <PaidBadge forma={pagamento.forma} />
                      ) : recusado ? (
                        <span className="text-[13px] text-slate">—</span>
                      ) : payFor === a.id ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={forma}
                            onValueChange={(v) => v && setForma(v as PaymentMethod)}
                            aria-label="Forma de pagamento"
                          >
                            {FORMAS.map((f) => (
                              <ToggleGroupItem key={f.value} value={f.value}>{f.label}</ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                          <Button size="sm" onClick={() => registrar(a.id)}>Confirmar</Button>
                          <Button size="sm" variant="danger" onClick={() => setPayFor(null)}>Cancelar</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setPayFor(a.id); setForma(PaymentMethod.PIX); setError(null); }}>
                          Marcar pago
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
