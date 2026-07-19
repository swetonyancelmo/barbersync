'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReportPeriodo, ReportSummary, WEEKDAYS_SHORT } from '@barbersync/shared';
import { api, apiDownload } from '@/lib/api';
import { brl, dataLonga, isoDate } from '@/lib/format';
import { TierBadge } from '@/components/ui';

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
      alert('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setExportando(false);
    }
  }

  const k = summary?.kpis;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Relatórios</h1>
          <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />
        </div>
        <button className="btn-outline" onClick={exportar} disabled={exportando || !summary}>
          {exportando ? 'Gerando PDF…' : 'Exportar PDF'}
        </button>
      </div>

      {/* Controles de período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              className="btn-outline"
              onClick={() => setPeriodo(p.value)}
              style={
                periodo === p.value
                  ? { borderColor: 'var(--pole)', color: 'var(--pole)', fontWeight: 700 }
                  : undefined
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-outline" onClick={() => navegar(-1)} aria-label="Período anterior">‹</button>
          <span style={{ minWidth: 170, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{rotulo}</span>
          <button className="btn-outline" onClick={() => navegar(1)} aria-label="Próximo período">›</button>
        </div>
        <button
          className="btn-outline"
          onClick={() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            setAnchor(d);
          }}
        >
          Hoje
        </button>
      </div>

      {erro && (
        <div className="card" style={{ marginBottom: 22 }}>
          <p className="muted" style={{ margin: 0, textAlign: 'center' }}>Não foi possível carregar o relatório.</p>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="kpi">
          <p className="kpi-label">Recebido</p>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{brl(k?.recebido ?? 0)}</div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Atendimentos concluídos</p>
          <div className="kpi-value">{k?.atendimentosConcluidos ?? 0}</div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Ticket médio</p>
          <div className="kpi-value">{brl(k?.ticketMedio ?? 0)}</div>
        </div>
      </div>

      {/* Gráfico: só faz sentido com mais de um dia (semana/mês) */}
      {summary && periodo !== 'dia' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <strong style={{ display: 'block', marginBottom: 14 }}>Recebido por dia</strong>
          {summary.kpis.recebido === 0 ? (
            <p className="muted" style={{ margin: 0, textAlign: 'center', padding: '18px 0' }}>
              Sem recebimentos no período.
            </p>
          ) : (
            <ReceitaBars serie={summary.serie} compacto={periodo === 'mes'} />
          )}
        </div>
      )}

      {/* Por barbeiro */}
      <SecaoTabela titulo="Recebido por barbeiro" vazio="Nenhum pagamento no período.">
        {summary && summary.porBarbeiro.length > 0 && (
          <table className="table">
            <thead>
              <tr><th>Barbeiro</th><th>Atendimentos</th><th>Recebido</th></tr>
            </thead>
            <tbody>
              {summary.porBarbeiro.map((b) => (
                <tr key={b.barbeiroId}>
                  <td>{b.nome}</td>
                  <td className="mono">{b.atendimentos}</td>
                  <td className="mono" style={{ color: 'var(--verd)' }}>{brl(b.recebido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SecaoTabela>

      {/* Clientes mais fiéis */}
      <SecaoTabela titulo="Clientes mais fiéis" vazio="Nenhum atendimento concluído no período.">
        {summary && summary.topClientes.length > 0 && (
          <table className="table">
            <thead>
              <tr><th>Cliente</th><th>Atendimentos</th><th>Total gasto</th><th>Tier</th></tr>
            </thead>
            <tbody>
              {summary.topClientes.map((c) => (
                <tr key={c.clienteId}>
                  <td>{c.nome}</td>
                  <td className="mono">{c.atendimentos}</td>
                  <td className="mono" style={{ color: 'var(--verd)' }}>{brl(c.totalGasto)}</td>
                  <td><TierBadge tier={c.tier} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SecaoTabela>

      {/* Serviços mais usados */}
      <SecaoTabela
        titulo="Serviços mais usados"
        nota="Receita estimada pelo preço atual do catálogo."
        vazio="Nenhum serviço concluído no período."
      >
        {summary && summary.topServicos.length > 0 && (
          <table className="table">
            <thead>
              <tr><th>Serviço</th><th>Vezes</th><th>Receita aprox.</th></tr>
            </thead>
            <tbody>
              {summary.topServicos.map((s) => (
                <tr key={s.servicoId}>
                  <td>{s.nome}</td>
                  <td className="mono">{s.vezes}</td>
                  <td className="mono" style={{ color: 'var(--verd)' }}>{brl(s.receitaAprox)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  children,
}: {
  titulo: string;
  nota?: string;
  vazio: string;
  children: React.ReactNode;
}) {
  const temConteudo = Boolean(children);
  return (
    <div className="card" style={{ marginBottom: 24, padding: 0 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <strong>{titulo}</strong>
        {nota && <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>{nota}</p>}
      </div>
      {temConteudo ? (
        <div className="table-wrap" style={{ marginTop: 10 }}>{children}</div>
      ) : (
        <p className="muted" style={{ padding: '18px 16px 20px', margin: 0, textAlign: 'center' }}>{vazio}</p>
      )}
    </div>
  );
}

/**
 * Barras de recebido por dia — série única em --verd, sem lib.
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
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: ALTURA + 26 }}>
      {serie.map((d, i) => {
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
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
              cursor: 'default',
              minWidth: 0,
            }}
          >
            <div
              className="receita-bar"
              style={{
                width: '100%',
                maxWidth: compacto ? 18 : 34,
                height: h,
                background: 'var(--verd)',
                borderRadius: '4px 4px 0 0',
                opacity: d.recebido > 0 ? 1 : 0,
              }}
            />
            {/* Linha de base sempre visível, mesmo em dia zerado */}
            <div style={{ width: '100%', borderTop: '1px solid var(--line)' }} />
            <span className="mono muted" style={{ fontSize: 10, marginTop: 4, whiteSpace: 'nowrap' }}>
              {rotulo}
            </span>
          </div>
        );
      })}
      <style jsx>{`
        div[title]:hover .receita-bar {
          background: var(--pole);
        }
      `}</style>
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
