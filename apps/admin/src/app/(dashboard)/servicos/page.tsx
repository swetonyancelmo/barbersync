'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { brl } from '@/lib/format';
import { IconTag, IconPlus } from '@/components/icons';

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracaoMin: number;
  preco: number;
}

const EMPTY = { nome: '', descricao: '', duracaoMin: 30, preco: 0 };

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setServicos(await api<Servico[]>('/services'));
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  function abrirNovo() {
    setForm(EMPTY); setEditId(null); setError(null); setOpen(true);
  }
  function abrirEdicao(s: Servico) {
    setForm({ nome: s.nome, descricao: s.descricao ?? '', duracaoMin: s.duracaoMin, preco: Number(s.preco) });
    setEditId(s.id); setError(null); setOpen(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      duracaoMin: Number(form.duracaoMin),
      preco: Number(form.preco),
    };
    try {
      if (editId) await api(`/services/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
      else await api('/services', { method: 'POST', body: JSON.stringify(body) });
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao salvar.');
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este serviço?')) return;
    await api(`/services/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Serviços</h1>
        <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={abrirNovo}>
          <IconPlus size={18} /> Novo serviço
        </button>
      </div>
      <div className="barber-rule" style={{ width: 60, marginBottom: 22 }} />

      {servicos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 36 }}>
          <span className="muted"><IconTag size={28} /></span>
          <p className="muted" style={{ margin: 0 }}>Nenhum serviço cadastrado. Comece adicionando um.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {servicos.map((s) => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{s.nome}</strong>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>{s.descricao || '—'}</p>
                </div>
                <strong className="mono" style={{ color: 'var(--brass-light)' }}>{brl(Number(s.preco))}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span className="badge badge-pending mono">{s.duracaoMin} min</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-outline" style={{ padding: '7px 14px', fontSize: 13 }} onClick={() => abrirEdicao(s)}>Editar</button>
                  <button className="btn-danger" style={{ padding: '7px 12px', fontSize: 13 }} onClick={() => remover(s.id)}>Remover</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={salvar} className="card card-raised" style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 20 }}>{editId ? 'Editar serviço' : 'Novo serviço'}</h3>
            <div><label className="label">Nome</label><input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></div>
            <div><label className="label">Descrição</label><input className="input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><label className="label">Duração (min)</label><input className="input mono" type="number" min={1} value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value) })} required /></div>
              <div style={{ flex: 1 }}><label className="label">Preço (R$)</label><input className="input mono" type="number" min={0} step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })} required /></div>
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-primary" style={{ width: 'auto' }}>Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
