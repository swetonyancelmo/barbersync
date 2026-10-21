'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelectedTenant } from '@/lib/tenant';
import { api, ApiError } from '@/lib/api';
import { brl, formatDateLong } from '@/lib/format';
import { BarberAvatar } from '@/components/ui';
import { IconStar, IconCheck } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

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
    return <div className="p-6 text-slate">Selecione uma barbearia na tela inicial.</div>;
  }

  // ---- Tela de confirmação (sucesso) -------------------------------------
  if (confirmado) {
    const barbeiro = barbeiros.find((b) => b.id === selBarb);
    return (
      <div className="mx-auto max-w-[460px] px-6 py-12 text-center">
        <div className="mb-2 inline-flex size-[72px] items-center justify-center rounded-full border-[1.5px] border-ok text-ok">
          <IconCheck size={34} />
        </div>
        <h1 className="mb-2 mt-3 text-[30px]">Agendamento enviado!</h1>
        <div className="barber-rule mx-auto mb-3.5 w-20" />
        <p className="text-slate">Sua solicitação está pendente de confirmação pela barbearia.</p>

        <div className="ticket my-6 p-5 text-left">
          <Row label="Serviço" value={servicosSel.map((s) => s.nome).join(', ')} />
          <Row label="Barbeiro" value={barbeiro?.user.nome ?? '—'} />
          <div className="ticket-perf" />
          <Row label="Data/hora" value={`${formatDateLong(selData)} · ${selHora}`} mono />
          <Row label="Valor" value={brl(total)} mono />
        </div>
        <p className="text-[13px] text-slate">
          {/* CLAUDE.md §7: canal do lembrete ainda não definido */}
          Você receberá um lembrete 1h antes do horário.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button asChild className="w-full">
            <Link href="/home">Voltar ao início</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/perfil">Ver meu perfil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const dias = nextDays(7);

  return (
    <div className="px-[18px] pb-[120px] pt-6">
      {/* Stepper — barber-rule na etapa atingida */}
      <div className="mb-2.5 flex gap-2" aria-hidden="true">
        {STEPS.map((_, i) =>
          i <= step ? (
            <span key={i} className="barber-rule flex-1" />
          ) : (
            <span key={i} className="h-1 flex-1 rounded-pill bg-tile-2" />
          ),
        )}
      </div>
      <p className="mono mb-[18px] text-xs uppercase tracking-[0.08em] text-slate">
        Etapa {step + 1}/3 · {STEPS[step]}
      </p>

      {/* Etapa 1: serviços (multi-select) */}
      {step === 0 && (
        <>
          <h2 className="mb-3.5 text-[22px]">Escolha o serviço</h2>
          {servicos.length === 0 && <p className="text-slate">Nenhum serviço disponível.</p>}
          <ToggleGroup
            type="multiple"
            value={selServ}
            onValueChange={setSelServ}
            aria-label="Serviços"
            className="flex-col items-stretch gap-2.5"
          >
            {servicos.map((s) => (
              <ToggleGroupItem
                key={s.id}
                value={s.id}
                variant="outline"
                className={cn(CARD_ITEM, 'group justify-between gap-3')}
              >
                <div>
                  <strong className="text-[15px]">{s.nome}</strong>
                  <p className="mt-1 text-[13px] font-normal text-slate">{s.descricao ?? `${s.duracaoMin} min`}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="mono font-bold text-verd">{brl(Number(s.preco))}</div>
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-on-enamel group-data-[state=on]:border-pine group-data-[state=on]:bg-pine">
                    <IconCheck size={15} className="hidden group-data-[state=on]:block" />
                  </span>
                </div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      )}

      {/* Etapa 2: barbeiro */}
      {step === 1 && (
        <>
          <h2 className="mb-3.5 text-[22px]">Escolha o barbeiro</h2>
          {barbeiros.length === 0 && <p className="text-slate">Nenhum barbeiro disponível.</p>}
          <ToggleGroup
            type="single"
            value={selBarb ?? ''}
            onValueChange={(v) => v && setSelBarb(v)}
            aria-label="Barbeiros"
            className="flex-col items-stretch gap-2.5"
          >
            {barbeiros.map((b) => (
              <ToggleGroupItem key={b.id} value={b.id} variant="outline" className={cn(CARD_ITEM, 'gap-3')}>
                <BarberAvatar nome={b.user.nome} />
                <div className="flex-1">
                  <strong className="text-[15px]">{b.user.nome}</strong>
                  <p className="text-[13px] font-normal text-slate">{b.especialidade ?? 'Barbeiro'}</p>
                </div>
                <Badge variant="ouro">
                  <IconStar size={12} /> <span className="mono">{Number(b.rating).toFixed(1)}</span>
                </Badge>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      )}

      {/* Etapa 3: horário */}
      {step === 2 && (
        <>
          <h2 className="mb-3.5 text-[22px]">Escolha o horário</h2>
          <ToggleGroup
            type="single"
            value={selData.toISOString()}
            onValueChange={(v) => {
              const d = dias.find((x) => x.toISOString() === v);
              if (d) setSelData(d);
            }}
            aria-label="Data"
            className="no-scrollbar mb-4 snap-x gap-2 overflow-x-auto pb-2"
          >
            {dias.map((d) => (
              <ToggleGroupItem
                key={d.toISOString()}
                value={d.toISOString()}
                variant="outline"
                className={cn(CHIP_ITEM, 'h-auto min-w-[58px] snap-start flex-col gap-0 rounded-xl py-2.5')}
              >
                <span className="text-[11px]">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                <span className="text-lg">{d.getDate()}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {grade && !grade.aberto && (
            <Card className="p-7 text-center">
              <p className="text-slate">Barbearia fechada neste dia. Escolha outra data.</p>
            </Card>
          )}
          {(['manha', 'tarde'] as const).map((periodo) => (
            grade?.aberto && grade[periodo].length > 0 &&
            <div key={periodo} className="mb-[18px]">
              <p className="mono mb-2 text-[11px] uppercase tracking-[0.08em] text-slate">
                {periodo === 'manha' ? 'Manhã' : 'Tarde'}
              </p>
              <ToggleGroup
                type="single"
                value={selHora ?? ''}
                onValueChange={(v) => v && setSelHora(v)}
                aria-label={periodo === 'manha' ? 'Horários da manhã' : 'Horários da tarde'}
                className="grid grid-cols-4 gap-2"
              >
                {grade[periodo].map((slot) => (
                  <ToggleGroupItem
                    key={slot.hora}
                    value={slot.hora}
                    variant="outline"
                    disabled={!slot.disponivel}
                    className={cn(CHIP_ITEM, 'mono h-auto rounded-[10px] py-2.5 text-sm font-semibold disabled:opacity-30')}
                  >
                    {slot.hora}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Footer fixo com total + ação (acima da bottom nav no mobile) */}
      <div className="fixed bottom-[calc(71px+env(safe-area-inset-bottom))] left-1/2 flex w-full max-w-[480px] -translate-x-1/2 items-center gap-3 border-t border-line bg-tile px-[18px] py-3.5 min-[900px]:bottom-0">
        <div className="flex-1">
          <div className="mono text-[11px] uppercase tracking-[0.06em] text-slate">
            Total {duracao > 0 ? `· ${duracao} min` : ''}
          </div>
          <strong className="mono text-lg text-verd">{brl(total)}</strong>
        </div>
        {step < 2 ? (
          <Button
            disabled={(step === 0 && selServ.length === 0) || (step === 1 && !selBarb)}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
          </Button>
        ) : (
          <Button disabled={!selHora || loading} onClick={confirmar}>
            {loading ? 'Enviando…' : 'Confirmar'}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Item de lista selecionável (serviço/barbeiro): card azulejo, borda vermelha quando marcado. */
const CARD_ITEM =
  'h-auto w-full justify-start whitespace-normal rounded-card p-6 text-left text-ink shadow-hairline data-[state=on]:border-pole data-[state=on]:bg-tile data-[state=on]:text-ink';

/** Chip de data/horário: marcado = gradiente de poste. */
const CHIP_ITEM =
  'data-[state=on]:border-pole-2 data-[state=on]:bg-gradient-to-b data-[state=on]:from-pole-bright data-[state=on]:to-pole-2 data-[state=on]:text-on-pole';

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-[9px]">
      <span className="mono text-[11px] uppercase tracking-[0.06em] text-slate">{label}</span>
      <strong className={cn('text-right', mono && 'mono')}>{value}</strong>
    </div>
  );
}
