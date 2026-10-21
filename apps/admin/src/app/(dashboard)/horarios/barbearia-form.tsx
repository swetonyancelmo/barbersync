'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExpedienteDia, WEEKDAYS } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FaixasEditor } from './faixas-editor';

/** Expediente da barbearia — a base que todo barbeiro herda. */
export function BarbeariaForm() {
  const [dias, setDias] = useState<ExpedienteDia[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ExpedienteDia[]>('/schedule').then(setDias).catch(() => setDias([]));
  }, []);

  function update(dia: number, patch: Partial<ExpedienteDia>) {
    setDias((cur) => cur && cur.map((d) => (d.diaSemana === dia ? { ...d, ...patch } : d)));
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
    <>
      <p className="mb-4 mt-0 text-sm text-slate">
        Dias e faixas de funcionamento da barbearia. Todo barbeiro segue este horário, a menos que
        você personalize o dele.
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
              <FaixasEditor blocos={d.blocos} onChange={(blocos) => update(d.diaSemana, { blocos })} />
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
    </>
  );
}
