'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelectedTenant } from '@/lib/tenant';
import { api, ApiError } from '@/lib/api';
import { brl, formatDateLong } from '@/lib/format';
import { BarberAvatar } from '@/components/ui';
import { IconStar, IconCheck } from '@/components/icons';

interface Servico { id: string; nome: string; descricao: string | null; duracaoMin: number; preco: number; }
interface Barbeiro { id: string; especialidade: string | null; rating: number; user: { nome: string }; }
interface Grade { aberto: boolean; manha: Slot[]; tarde: Slot[]; }
interface Slot { hora: string; disponivel: boolean; }

const STEPS = ['Serviço', 'Barbeiro', 'Horário'];

/** Próximos 7 dias como chips de data. */
function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export default function AgendarPage() {
  const { tenantId } = useSelectedTenant();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);

  const [selServ, setSelServ] = useState<string[]>([]);
  const [selBarb, setSelBarb] = useState<string | null>(null);
  const [selData, setSelData] = useState<Date>(nextDays(1)[0]);
  const [selHora, setSelHora] = useState<string | null>(null);

  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    api<Servico[]>(`/services?tenantId=${tenantId}`).then(setServicos).catch(() => {});
    api<Barbeiro[]>(`/barbers?tenantId=${tenantId}`).then(setBarbeiros).catch(() => {});
  }, [tenantId]);

  const dataStr = useMemo(
    () => selData.toISOString().slice(0, 10),
    [selData],
  );

  useEffect(() => {
    if (step !== 2 || !selBarb || !tenantId) return;
    setSelHora(null);
    api<Grade>(`/appointments/availability?tenantId=${tenantId}&barbeiroId=${selBarb}&data=${dataStr}`)
      .then(setGrade)
      .catch(() => setGrade(null));
  }, [step, selBarb, dataStr, tenantId]);

  const servicosSel = servicos.filter((s) => selServ.includes(s.id));
  const total = servicosSel.reduce((sum, s) => sum + Number(s.preco), 0);
  const duracao = servicosSel.reduce((sum, s) => sum + s.duracaoMin, 0);

  const toggleServ = (id: string) =>
    setSelServ((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function confirmar() {
    if (!selBarb || !selHora || !tenantId) return;
    setLoading(true);
    setError(null);
    const [h, m] = selHora.split(':').map(Number);
    const dataHora = new Date(selData);
    dataHora.setHours(h, m, 0, 0);
    try {
      await api('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          barbeiroId: selBarb,
          servicoIds: selServ,
          dataHora: dataHora.toISOString(),
        }),
      });
      setConfirmado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao confirmar.');
    } finally {
      setLoading(false);
    }
  }

  if (!tenantId) {
    return <div style={{ padding: 24 }} className="muted">Selecione uma barbearia na tela inicial.</div>;
  }

  // ---- Tela de confirmação (sucesso) -------------------------------------
  if (confirmado) {
    const barbeiro = barbeiros.find((b) => b.id === selBarb);
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', border: '1.5px solid var(--ok)', color: 'var(--ok)', marginBottom: 8 }}>
          <IconCheck size={34} />
        </div>
        <h1 style={{ fontSize: 30, margin: '12px 0 8px' }}>Agendamento enviado!</h1>
        <div className="barber-rule" style={{ width: 80, margin: '0 auto 14px' }} />
        <p className="muted">Sua solicitação está pendente de confirmação pela barbearia.</p>

        <div className="ticket" style={{ textAlign: 'left', margin: '24px 0', padding: 20 }}>
          <Row label="Serviço" value={servicosSel.map((s) => s.nome).join(', ')} />
          <Row label="Barbeiro" value={barbeiro?.user.nome ?? '—'} />
          <div className="ticket-perf" />
          <Row label="Data/hora" value={`${formatDateLong(selData)} · ${selHora}`} mono />
          <Row label="Valor" value={brl(total)} mono />
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          {/* CLAUDE.md §7: canal do lembrete ainda não definido */}
          Você receberá um lembrete 1h antes do horário.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <Link href="/home"><button className="btn-primary">Voltar ao início</button></Link>
          <Link href="/perfil"><button className="btn-outline" style={{ width: '100%' }}>Ver meu perfil</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 18px 120px' }}>
      {/* Stepper — barber-rule na etapa atingida */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {STEPS.map((_, i) => (
          i <= step
            ? <span key={i} className="barber-rule" style={{ flex: 1 }} />
            : <span key={i} className="progress-track" style={{ flex: 1, height: 4, border: 'none' }} />
        ))}
      </div>
      <p className="muted mono" style={{ fontSize: 12, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Etapa {step + 1}/3 · {STEPS[step]}
      </p>

      {/* Etapa 1: serviços (multi-select) */}
      {step === 0 && (
        <>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Escolha o serviço</h2>
          {servicos.length === 0 && <p className="muted">Nenhum serviço disponível.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {servicos.map((s) => {
              const on = selServ.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleServ(s.id)}
                  className="card"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: on ? 'var(--gold-1)' : 'var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'var(--text)',
                  }}
                >
                  <div>
                    <strong>{s.nome}</strong>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                      {s.descricao ?? `${s.duracaoMin} min`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="mono" style={{ color: 'var(--verd)', fontWeight: 700 }}>{brl(Number(s.preco))}</div>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%',
                        border: on ? 'none' : '1.5px solid var(--line)',
                        background: on ? 'var(--pine)' : 'transparent',
                        color: '#f7f2e4', flexShrink: 0,
                      }}
                    >
                      {on && <IconCheck size={15} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Etapa 2: barbeiro */}
      {step === 1 && (
        <>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Escolha o barbeiro</h2>
          {barbeiros.length === 0 && <p className="muted">Nenhum barbeiro disponível.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {barbeiros.map((b) => {
              const on = selBarb === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelBarb(b.id)}
                  className="card"
                  style={{
                    textAlign: 'left', cursor: 'pointer', color: 'var(--text)',
                    borderColor: on ? 'var(--gold-1)' : 'var(--border)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <BarberAvatar nome={b.user.nome} />
                  <div style={{ flex: 1 }}>
                    <strong>{b.user.nome}</strong>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>{b.especialidade ?? 'Barbeiro'}</p>
                  </div>
                  <span className="badge badge-ouro"><IconStar size={12} /> <span className="mono">{Number(b.rating).toFixed(1)}</span></span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Etapa 3: horário */}
      {step === 2 && (
        <>
          <h2 style={{ fontSize: 22, marginBottom: 14 }}>Escolha o horário</h2>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            {nextDays(7).map((d) => {
              const on = d.toDateString() === selData.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelData(d)}
                  style={{
                    minWidth: 58, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                    background: on ? 'var(--gold-grad)' : 'var(--surface)',
                    color: on ? '#fbf5e8' : 'var(--text)',
                    border: on ? '1px solid var(--pole-2)' : '1px solid var(--border)', textAlign: 'center', fontWeight: 700,
                  }}
                >
                  <div style={{ fontSize: 11 }}>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                  <div style={{ fontSize: 18 }}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {grade && !grade.aberto && (
            <div className="card" style={{ textAlign: 'center', padding: 28 }}>
              <p className="muted" style={{ margin: 0 }}>Barbearia fechada neste dia. Escolha outra data.</p>
            </div>
          )}
          {(['manha', 'tarde'] as const).map((periodo) => (
            grade?.aberto && grade[periodo].length > 0 &&
            <div key={periodo} style={{ marginBottom: 18 }}>
              <p className="muted mono" style={{ fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {grade[periodo].map((slot) => (
                  <button
                    key={slot.hora}
                    className="mono"
                    disabled={!slot.disponivel}
                    onClick={() => setSelHora(slot.hora)}
                    style={{
                      padding: '10px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                      cursor: slot.disponivel ? 'pointer' : 'not-allowed',
                      opacity: slot.disponivel ? 1 : 0.3,
                      background: selHora === slot.hora ? 'var(--gold-grad)' : 'var(--surface)',
                      color: selHora === slot.hora ? '#fbf5e8' : 'var(--text)',
                      border: selHora === slot.hora ? '1px solid var(--pole-2)' : '1px solid var(--border)',
                    }}
                  >
                    {slot.hora}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {error && <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>}
        </>
      )}

      {/* Footer fixo com total + ação */}
      <div
        style={{
          position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '14px 18px',
          background: 'var(--bg-2)', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div className="muted mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total {duracao > 0 ? `· ${duracao} min` : ''}</div>
          <strong className="mono" style={{ fontSize: 18, color: 'var(--brass-light)' }}>{brl(total)}</strong>
        </div>
        {step < 2 ? (
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '12px 28px' }}
            disabled={(step === 0 && selServ.length === 0) || (step === 1 && !selBarb)}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '12px 28px' }}
            disabled={!selHora || loading}
            onClick={confirmar}
          >
            {loading ? 'Enviando…' : 'Confirmar'}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0' }}>
      <span className="muted mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <strong className={mono ? 'mono' : ''} style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}
