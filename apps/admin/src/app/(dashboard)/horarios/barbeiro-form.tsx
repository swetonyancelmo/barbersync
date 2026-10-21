'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  blocosContidos,
  ExpedienteBarbeiroDia,
  Folga,
  WEEKDAYS,
} from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FaixasEditor, faixasTexto } from './faixas-editor';

interface SemanaBarbeiro { dias: ExpedienteBarbeiroDia[]; folgas: Folga[]; }

/** Problema de um dia personalizado, ou null. Espelha a validação da API. */
function problemaDoDia(d: ExpedienteBarbeiroDia): string | null {
  if (!d.personalizado || !d.aberto) return null;
  if (d.blocos.length === 0) return 'Adicione ao menos uma faixa ou marque que não atende.';
  if (d.blocos.some((b) => b.inicio >= b.fim)) return 'O início de cada faixa precisa ser antes do fim.';
  if (!blocosContidos(d.blocos, d.barbearia.blocos)) {
    return 'O horário do barbeiro precisa caber no horário da barbearia.';
  }
  return null;
}

function hojeYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dataLonga(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/**
 * Horário de um barbeiro: cada dia segue a barbearia ou é personalizado
 * (dentro do horário dela), mais as folgas por data. Só o ADMIN edita.
 */
export function BarbeiroForm({ barbeiroId, nome, podeEditar }: {
  barbeiroId: string;
  nome: string;
  podeEditar: boolean;
}) {
  const [semana, setSemana] = useState<SemanaBarbeiro | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [novaData, setNovaData] = useState('');
  const [novoMotivo, setNovoMotivo] = useState('');
  const [addingFolga, setAddingFolga] = useState(false);
  const [erroFolga, setErroFolga] = useState<string | null>(null);
  const [remover, setRemover] = useState<Folga | null>(null);

  useEffect(() => {
    setSemana(null);
    setErroCarga(null);
    api<SemanaBarbeiro>(`/schedule/barbeiros/${barbeiroId}`)
      .then(setSemana)
      .catch((err) => setErroCarga(err instanceof ApiError ? err.message : 'Falha ao carregar.'));
  }, [barbeiroId]);

  function update(dia: number, patch: Partial<ExpedienteBarbeiroDia>) {
    setSemana((cur) => cur && {
      ...cur,
      dias: cur.dias.map((d) => (d.diaSemana === dia ? { ...d, ...patch } : d)),
    });
  }

  /** Ligar "personalizado" começa do horário da barbearia — o dono só recorta. */
  function setPersonalizado(d: ExpedienteBarbeiroDia, on: boolean) {
    update(d.diaSemana, on
      ? { personalizado: true, aberto: true, blocos: d.barbearia.blocos.map((b) => ({ ...b })) }
      : { personalizado: false, aberto: d.barbearia.aberto, blocos: d.barbearia.blocos });
  }

  const problemas = semana?.dias.map(problemaDoDia) ?? [];
  const temProblema = problemas.some(Boolean);

  async function salvar() {
    if (!semana || temProblema) return;
    setSaving(true); setError(null);
    try {
      const dias = semana.dias.map(({ diaSemana, personalizado, aberto, blocos }) => ({
        diaSemana, personalizado, aberto, blocos,
      }));
      const res = await api<SemanaBarbeiro>(`/schedule/barbeiros/${barbeiroId}`, {
        method: 'PUT', body: JSON.stringify({ dias }),
      });
      setSemana(res);
      toast.success(`Horário de ${nome} salvo.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function adicionarFolga(e: React.FormEvent) {
    e.preventDefault();
    if (!novaData) return;
    setAddingFolga(true); setErroFolga(null);
    try {
      const folga = await api<Folga>(`/schedule/barbeiros/${barbeiroId}/folgas`, {
        method: 'POST',
        body: JSON.stringify({ data: novaData, motivo: novoMotivo || undefined }),
      });
      setSemana((cur) => cur && {
        ...cur,
        folgas: [...cur.folgas, folga].sort((a, b) => a.data.localeCompare(b.data)),
      });
      setNovaData(''); setNovoMotivo('');
      toast.success('Folga marcada.');
    } catch (err) {
      setErroFolga(err instanceof ApiError ? err.message : 'Falha ao marcar a folga.');
    } finally {
      setAddingFolga(false);
    }
  }

  async function confirmarRemocao() {
    if (!remover) return;
    try {
      await api(`/schedule/barbeiros/${barbeiroId}/folgas/${remover.id}`, { method: 'DELETE' });
      setSemana((cur) => cur && { ...cur, folgas: cur.folgas.filter((f) => f.id !== remover.id) });
      toast.success('Folga removida.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha ao remover a folga.');
    } finally {
      setRemover(null);
    }
  }

  if (erroCarga) {
    return <Alert variant="destructive"><AlertDescription>{erroCarga}</AlertDescription></Alert>;
  }

  return (
    <>
      <p className="mb-4 mt-0 text-sm text-slate">
        Por padrão {nome} segue o horário da barbearia. Personalize os dias em que o horário é
        diferente — sempre dentro do horário da barbearia. Mudanças não afetam agendamentos já feitos.
      </p>

      <div className="flex flex-col gap-2.5">
        {semana === null && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[62px] rounded-card" />)}
        {semana?.dias.map((d, idx) => {
          const fechadaNoDia = !d.barbearia.aberto;
          return (
            <Card key={d.diaSemana} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="min-w-24 text-base">{WEEKDAYS[d.diaSemana]}</strong>
                {fechadaNoDia ? (
                  <span className="text-sm text-slate">Barbearia fechada</span>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <Switch
                      checked={d.personalizado}
                      disabled={!podeEditar}
                      onCheckedChange={(v) => setPersonalizado(d, v)}
                      aria-label={`${WEEKDAYS[d.diaSemana]}: horário personalizado`}
                    />
                    <span className={d.personalizado ? '' : 'text-slate'}>
                      {d.personalizado ? 'Personalizado' : 'Segue a barbearia'}
                    </span>
                  </label>
                )}
              </div>

              {!fechadaNoDia && !d.personalizado && (
                <p className="mono m-0 mt-2 text-[13px] text-slate">{faixasTexto(d.barbearia.blocos)}</p>
              )}

              {!fechadaNoDia && d.personalizado && (
                <div className="mt-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <Switch
                      checked={d.aberto}
                      disabled={!podeEditar}
                      onCheckedChange={(v) => update(d.diaSemana, {
                        aberto: v,
                        blocos: v ? d.barbearia.blocos.map((b) => ({ ...b })) : [],
                      })}
                      aria-label={`${WEEKDAYS[d.diaSemana]}: atende`}
                    />
                    <span className={d.aberto ? '' : 'text-slate'}>{d.aberto ? 'Atende' : 'Não atende'}</span>
                  </label>
                  {d.aberto && (podeEditar ? (
                    <FaixasEditor
                      blocos={d.blocos}
                      onChange={(blocos) => update(d.diaSemana, { blocos })}
                      novaFaixa={d.barbearia.blocos[0] ?? { inicio: '09:00', fim: '12:00' }}
                    />
                  ) : (
                    <p className="mono m-0 mt-2 text-[13px]">{faixasTexto(d.blocos)}</p>
                  ))}
                  <p className="m-0 mt-2 text-[12px] text-slate">
                    Barbearia neste dia: <span className="mono">{faixasTexto(d.barbearia.blocos)}</span>
                  </p>
                  {problemas[idx] && <p className="m-0 mt-1.5 text-[13px] text-danger">{problemas[idx]}</p>}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {podeEditar && (
        <div className="mt-5 flex flex-wrap items-center gap-3.5">
          <Button disabled={saving || semana === null || temProblema} onClick={salvar}>
            {saving ? 'Salvando…' : `Salvar horário de ${nome.split(' ')[0]}`}
          </Button>
          {error && <Alert variant="destructive" className="w-auto py-2"><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
      )}

      {/* Folgas por data */}
      <h2 className="mb-1 mt-8 text-xl">Folgas</h2>
      <p className="mb-3 mt-0 text-sm text-slate">
        Dias inteiros em que {nome.split(' ')[0]} não atende (férias, consulta, feriado). O cliente
        não consegue agendar com ele nessas datas.
      </p>
      <Card className="p-4">
        {semana && semana.folgas.length === 0 && (
          <p className="m-0 text-sm text-slate">Nenhuma folga marcada.</p>
        )}
        {semana && semana.folgas.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {semana.folgas.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft pb-2 last:border-0 last:pb-0">
                <div>
                  <span className="mono text-sm">{dataLonga(f.data)}</span>
                  {f.motivo && <span className="text-sm text-slate"> · {f.motivo}</span>}
                </div>
                {podeEditar && (
                  <Button variant="danger" size="sm" onClick={() => setRemover(f)}>Remover</Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {podeEditar && (
          <form onSubmit={adicionarFolga} className="mt-4 flex flex-wrap items-end gap-2.5 border-t border-line-soft pt-4">
            <div className="flex-[1_1_150px]">
              <Label htmlFor="folga-data">Data</Label>
              <Input
                id="folga-data"
                type="date"
                min={hojeYmd()}
                value={novaData}
                onChange={(e) => { setNovaData(e.target.value); setErroFolga(null); }}
                className="font-mono"
                required
              />
            </div>
            <div className="flex-[2_1_200px]">
              <Label htmlFor="folga-motivo">Motivo (opcional)</Label>
              <Input
                id="folga-motivo"
                value={novoMotivo}
                maxLength={80}
                placeholder="Ex.: férias"
                onChange={(e) => setNovoMotivo(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" disabled={!novaData || addingFolga}>
              {addingFolga ? 'Marcando…' : 'Marcar folga'}
            </Button>
          </form>
        )}
        {erroFolga && (
          <Alert variant="destructive" className="mt-3"><AlertDescription>{erroFolga}</AlertDescription></Alert>
        )}
      </Card>

      <AlertDialog open={remover !== null} onOpenChange={(o) => !o && setRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover folga?</AlertDialogTitle>
            <AlertDialogDescription>
              {remover && `${nome} volta a aceitar agendamentos em ${dataLonga(remover.data)}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRemocao}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
