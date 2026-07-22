'use client';

import { useEffect, useState } from 'react';
import { ExpedienteDia, WEEKDAYS } from '@barbersync/shared';
import { api, ApiError } from '@/lib/api';
import { IconPlus } from '@/components/icons';

export default function HorariosPage() {
  const [dias, setDias] = useState<ExpedienteDia[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<ExpedienteDia[]>('/schedule').then(setDias).catch(() => {});
  }, []);

  function update(dia: number, patch: Partial<ExpedienteDia>) {
    setDias((cur) => cur.map((d) => (d.diaSemana === dia ? { ...d, ...patch } : d)));
  }
  function updateBloco(dia: number, idx: number, campo: 'inicio' | 'fim', valor: string) {
    setDias((cur) =>
      cur.map((d) =>
        d.diaSemana === dia
          ? { ...d, blocos: d.blocos.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b)) }
          : d,
      ),
    );
  }
  function addBloco(dia: number) {
    setDias((cur) => cur.map((d) => (d.diaSemana === dia ? { ...d, blocos: [...d.blocos, { inicio: '09:00', fim: '12:00' }] } : d)));
  }
  function removeBloco(dia: number, idx: number) {
    setDias((cur) => cur.map((d) => (d.diaSemana === dia ? { ...d, blocos: d.blocos.filter((_, i) => i !== idx) } : d)));
  }

  async function salvar() {
    setSaving(true); setMsg(null); setError(null);
    try {
      const updated = await api<ExpedienteDia[]>('/schedule', { method: 'PUT', body: JSON.stringify({ dias }) });
      setDias(updated);
      setMsg('Horários salvos.');
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, margin: 0 }}>Horários</h1>
      <div className="barber-rule" style={{ width: 60, margin: '8px 0 8px' }} />
      <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
        Dias e faixas de funcionamento da barbearia. A grade de horários do cliente é gerada a partir daqui.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {dias.map((d) => (
          <div key={d.diaSemana} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <strong style={{ fontSize: 16, minWidth: 96 }}>{WEEKDAYS[d.diaSemana]}</strong>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={d.aberto} onChange={(e) => update(d.diaSemana, { aberto: e.target.checked })} />
                <span className={d.aberto ? '' : 'muted'}>{d.aberto ? 'Aberto' : 'Fechado'}</span>
              </label>
            </div>

            {d.aberto && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.blocos.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <input className="input mono" type="time" value={b.inicio} onChange={(e) => updateBloco(d.diaSemana, i, 'inicio', e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, maxWidth: 130 }} />
                    <span className="muted">até</span>
                    <input className="input mono" type="time" value={b.fim} onChange={(e) => updateBloco(d.diaSemana, i, 'fim', e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, maxWidth: 130 }} />
                    <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 13, flexShrink: 0, marginLeft: 'auto' }} onClick={() => removeBloco(d.diaSemana, i)}>Remover</button>
                  </div>
                ))}
                <button className="btn-outline" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }} onClick={() => addBloco(d.diaSemana)}>
                  <IconPlus size={15} /> Adicionar faixa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
        <button className="btn-primary" style={{ width: 'auto' }} disabled={saving} onClick={salvar}>
          {saving ? 'Salvando…' : 'Salvar horários'}
        </button>
        {msg && <span style={{ color: 'var(--ok)', fontSize: 14 }}>{msg}</span>}
        {error && <span style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</span>}
      </div>
    </div>
  );
}
