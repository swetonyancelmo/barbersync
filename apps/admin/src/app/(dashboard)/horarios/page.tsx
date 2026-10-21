'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExpedienteDia, WEEKDAYS } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { IconPlus } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function HorariosPage() {
  const [dias, setDias] = useState<ExpedienteDia[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ExpedienteDia[]>('/schedule').then(setDias).catch(() => setDias([]));
  }, []);

  function update(dia: number, patch: Partial<ExpedienteDia>) {
    setDias((cur) => cur && cur.map((d) => (d.diaSemana === dia ? { ...d, ...patch } : d)));
  }
  function updateBloco(dia: number, idx: number, campo: 'inicio' | 'fim', valor: string) {
    setDias((cur) =>
      cur && cur.map((d) =>
        d.diaSemana === dia
          ? { ...d, blocos: d.blocos.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b)) }
          : d,
      ),
    );
  }
  function addBloco(dia: number) {
    setDias((cur) => cur && cur.map((d) => (d.diaSemana === dia ? { ...d, blocos: [...d.blocos, { inicio: '09:00', fim: '12:00' }] } : d)));
  }
  function removeBloco(dia: number, idx: number) {
    setDias((cur) => cur && cur.map((d) => (d.diaSemana === dia ? { ...d, blocos: d.blocos.filter((_, i) => i !== idx) } : d)));
  }

  async function salvar() {
    setSaving(true); setError(null);
    try {
      const updated = await api<ExpedienteDia[]>('/schedule', { method: 'PUT', body: JSON.stringify({ dias }) });
      setDias(updated);
      toast.success('Horários salvos.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="m-0 text-[28px]">Horários</h1>
      <div className="barber-rule my-2 w-[60px]" />
      <p className="mb-4 mt-0 text-sm text-slate">
        Dias e faixas de funcionamento da barbearia. A grade de horários do cliente é gerada a partir daqui.
      </p>

      <div className="flex flex-col gap-2.5">
        {dias === null && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[62px] rounded-card" />)}
        {dias?.map((d) => (
          <Card key={d.diaSemana} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <strong className="min-w-24 text-base">{WEEKDAYS[d.diaSemana]}</strong>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <Switch
                  checked={d.aberto}
                  onCheckedChange={(v) => update(d.diaSemana, { aberto: v })}
                  aria-label={`${WEEKDAYS[d.diaSemana]} aberto`}
                />
                <span className={d.aberto ? '' : 'text-slate'}>{d.aberto ? 'Aberto' : 'Fechado'}</span>
              </label>
            </div>

            {d.aberto && (
              <div className="mt-3.5 flex flex-col gap-2.5">
                {d.blocos.map((b, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2.5">
                    <Input
                      type="time"
                      aria-label="Início"
                      className="min-w-0 max-w-[130px] flex-[1_1_120px] font-mono"
                      value={b.inicio}
                      onChange={(e) => updateBloco(d.diaSemana, i, 'inicio', e.target.value)}
                    />
                    <span className="text-slate">até</span>
                    <Input
                      type="time"
                      aria-label="Fim"
                      className="min-w-0 max-w-[130px] flex-[1_1_120px] font-mono"
                      value={b.fim}
                      onChange={(e) => updateBloco(d.diaSemana, i, 'fim', e.target.value)}
                    />
                    <Button variant="danger" size="sm" className="ml-auto shrink-0" onClick={() => removeBloco(d.diaSemana, i)}>
                      Remover
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="self-start" onClick={() => addBloco(d.diaSemana)}>
                  <IconPlus size={15} /> Adicionar faixa
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3.5">
        <Button disabled={saving || dias === null} onClick={salvar}>
          {saving ? 'Salvando…' : 'Salvar horários'}
        </Button>
        {error && <Alert variant="destructive" className="w-auto py-2"><AlertDescription>{error}</AlertDescription></Alert>}
      </div>
    </div>
  );
}
