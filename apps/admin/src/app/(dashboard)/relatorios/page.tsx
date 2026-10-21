'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReportPeriodo, ReportSummary, WEEKDAYS_SHORT } from '@barbersync/shared';
import { api, apiDownload } from '@/lib/api';
import { brl, dataLonga, isoDate } from '@/lib/format';
import { toast } from 'sonner';
import { KpiCard, TierBadge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PERIODOS: { value: ReportPeriodo; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState<ReportPeriodo>('dia');
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [erro, setErro] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setErro(false);
    api<ReportSummary>(`/reports/summary?periodo=${periodo}&data=${isoDate(anchor)}`)
      .then(setSummary)
      .catch(() => {
        setSummary(null);
        setErro(true);
      });
  }, [periodo, anchor]);

  function navegar(delta: number) {
    setAnchor((d) => {
      const x = new Date(d);
      if (periodo === 'dia') x.setDate(x.getDate() + delta);
      else if (periodo === 'semana') x.setDate(x.getDate() + delta * 7);
      else x.setMonth(x.getMonth() + delta, 1);
      return x;
    });
  }

  const rotulo = useMemo(() => periodoLabel(periodo, anchor, summary), [periodo, anchor, summary]);

  async function exportar() {
    setExportando(true);
    try {
      const data = isoDate(anchor);
      await apiDownload(
        `/reports/summary/pdf?periodo=${periodo}&data=${data}`,
        `relatorio-${periodo}-${data}.pdf`,
      );
    } catch {
      toast.error('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExportando(false);
    }
  }

  const k = summary?.kpis;
  const carregando = summary === null && !erro;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-2 mt-0 text-[28px]">Relatórios</h1>
          <div className="barber-rule mb-5 w-[60px]" />
        </div>
        <Button variant="outline" onClick={exportar} disabled={exportando || !summary}>
          {exportando ? 'Gerando PDF…' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Controles de período */}
      <div className="mb-[22px] flex flex-wrap items-center gap-2.5">
        <ToggleGroup
          type="single"
          variant="outline"
          value={periodo}
          onValueChange={(v) => v && setPeriodo(v as ReportPeriodo)}
          aria-label="Período do relatório"
        >
          {PERIODOS.map((p) => (
            <ToggleGroupItem key={p.value} value={p.value}>{p.label}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navegar(-1)} aria-label="Período anterior">‹</Button>
          <span className="min-w-[170px] text-center text-sm font-semibold">{rotulo}</span>
          <Button variant="outline" size="icon" onClick={() => navegar(1)} aria-label="Próximo período">›</Button>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            setAnchor(d);
          }}
        >
          Hoje
        </Button>
      </div>

      {erro && (
        <Alert variant="destructive" className="mb-[22px]">
          <AlertDescription>Não foi possível carregar o relatório.</AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        <KpiCard label="Recebido" carregando={carregando} valueClassName="text-ok" value={brl(k?.recebido ?? 0)} />
        <KpiCard label="Atendimentos concluídos" carregando={carregando} value={k?.atendimentosConcluidos ?? 0} />
        <KpiCard label="Ticket médio" carregando={carregando} value={brl(k?.ticketMedio ?? 0)} />
      </div>

      {/* Gráfico: só faz sentido com mais de um dia (semana/mês) */}
      {summary && periodo !== 'dia' && (
        <Card className="mb-6 p-4">
          <strong className="mb-3.5 block">Recebido por dia</strong>
          {summary.kpis.recebido === 0 ? (
            <p className="py-[18px] text-center text-slate">Sem recebimentos no período.</p>
          ) : (
            <ReceitaBars serie={summary.serie} compacto={periodo === 'mes'} />
          )}
        </Card>
      )}

      {/* Por barbeiro */}
      <SecaoTabela titulo="Recebido por barbeiro" vazio="Nenhum pagamento no período." carregando={carregando}>
        {summary && summary.porBarbeiro.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Barbeiro</TableHead><TableHead>Atendimentos</TableHead><TableHead>Recebido</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summary.porBarbeiro.map((b) => (
                <TableRow key={b.barbeiroId}>
                  <TableCell className="font-semibold">{b.nome}</TableCell>
                  <TableCell className="font-mono">{b.atendimentos}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-verd">{brl(b.recebido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SecaoTabela>

      {/* Clientes mais fiéis */}
      <SecaoTabela titulo="Clientes mais fiéis" vazio="Nenhum atendimento concluído no período." carregando={carregando}>
        {summary && summary.topClientes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cliente</TableHead><TableHead>Atendimentos</TableHead><TableHead>Total gasto</TableHead><TableHead>Tier</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summary.topClientes.map((c) => (
                <TableRow key={c.clienteId}>
                  <TableCell className="font-semibold">{c.nome}</TableCell>
                  <TableCell className="font-mono">{c.atendimentos}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-verd">{brl(c.totalGasto)}</TableCell>
                  <TableCell><TierBadge tier={c.tier} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SecaoTabela>

      {/* Serviços mais usados */}
      <SecaoTabela
        titulo="Serviços mais usados"
        nota="Receita estimada pelo preço atual do catálogo."
        vazio="Nenhum serviço concluído no período."
        carregando={carregando}
      >
        {summary && summary.topServicos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Serviço</TableHead><TableHead>Vezes</TableHead><TableHead>Receita aprox.</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {summary.topServicos.map((s) => (
                <TableRow key={s.servicoId}>
                  <TableCell className="font-semibold">{s.nome}</TableCell>
                  <TableCell className="font-mono">{s.vezes}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-verd">{brl(s.receitaAprox)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SecaoTabela>
    </div>
  );
}

/** Card de seção com tabela — mostra o vazio quando o children não renderiza. */
function SecaoTabela({
  titulo,
  nota,
  vazio,
  carregando,
  children,
}: {
  titulo: string;
  nota?: string;
  vazio: string;
  carregando?: boolean;
  children: React.ReactNode;
}) {
  const temConteudo = Boolean(children);
  return (
    <Card className="mb-6 overflow-hidden p-0">
      <div className="px-4 pt-4">
        <strong>{titulo}</strong>
        {nota && <p className="mt-1 text-xs text-slate">{nota}</p>}
      </div>
      {carregando ? (
        <div className="flex flex-col gap-2 p-4"><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-full" /></div>
      ) : temConteudo ? (
        <div className="mt-2.5">{children}</div>
      ) : (
        <p className="px-4 pb-5 pt-[18px] text-center text-slate">{vazio}</p>
      )}
    </Card>
  );
}

/**
 * Barras de recebido por dia — série única em verd, sem lib.
 * Tooltip nativo por barra; rótulos de dia embaixo (esparsos no mês).
 */
function ReceitaBars({
  serie,
  compacto,
}: {
  serie: ReportSummary['serie'];
  compacto: boolean;
}) {
  const max = Math.max(...serie.map((d) => d.recebido), 1);
  const ALTURA = 140;

  return (
    <div className="flex items-end gap-0.5" style={{ height: ALTURA + 26 }}>
      {serie.map((d) => {
        const h = d.recebido > 0 ? Math.max(4, Math.round((d.recebido / max) * ALTURA)) : 0;
        const diaNum = Number(d.dia.slice(8, 10));
        const rotulo = compacto
          ? diaNum === 1 || diaNum % 5 === 0
            ? String(diaNum)
            : ''
          : WEEKDAYS_SHORT[(new Date(`${d.dia}T00:00:00`).getDay() + 7) % 7];
        return (
          <div
            key={d.dia}
            title={`${formatDiaCurto(d.dia)} — ${brl(d.recebido)} (${d.atendimentos} pagamento${d.atendimentos === 1 ? '' : 's'})`}
            className="group flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
          >
            <div
              className={`w-full rounded-t bg-verd transition-colors group-hover:bg-pole ${compacto ? 'max-w-[18px]' : 'max-w-[34px]'} ${d.recebido > 0 ? '' : 'opacity-0'}`}
              style={{ height: h }}
            />
            {/* Linha de base sempre visível, mesmo em dia zerado */}
            <div className="w-full border-t border-line" />
            <span className="mt-1 whitespace-nowrap font-mono text-[10px] text-slate">{rotulo}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatDiaCurto(dia: string): string {
  return new Date(`${dia}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function periodoLabel(periodo: ReportPeriodo, anchor: Date, summary: ReportSummary | null): string {
  if (periodo === 'dia') return dataLonga(anchor);
  if (periodo === 'semana') {
    // Usa o período resolvido pelo backend quando disponível (segunda→domingo).
    const inicio = summary ? new Date(summary.periodo.inicio) : anchor;
    const fim = summary
      ? new Date(new Date(summary.periodo.fim).getTime() - 86_400_000)
      : anchor;
    const f = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${f(inicio)} – ${f(fim)}`;
  }
  return anchor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
