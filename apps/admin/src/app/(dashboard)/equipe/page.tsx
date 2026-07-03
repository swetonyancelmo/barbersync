'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { BarberAvatar } from '@/components/ui';

interface Barbeiro {
  id: string;
  especialidade: string | null;
  rating: number;
  ativo: boolean;
  user: { nome: string; telefone: string | null };
}

const EMPTY = { nome: '', email: '', senha: '', especialidade: '', telefone: '' };

export default function EquipePage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await api<Barbeiro[]>('/barbers');
    setBarbeiros(list.filter((b) => b.ativo));
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/barbers', { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao adicionar.');
    }
  }

  async function remover(id: string) {
    try {
      await api(`/barbers/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Falha ao remover.');
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Equipe</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {barbeiros.map((b) => (
          <div key={b.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <BarberAvatar nome={b.user.nome} size={52} />
              <div>
                <strong>{b.user.nome}</strong>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{b.especialidade ?? 'Barbeiro'}</p>
              </div>
            </div>
            <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>{b.user.telefone ?? 'Sem telefone'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-success">Ativo</span>
              <button className="btn-danger" onClick={() => remover(b.id)}>Remover</button>
            </div>
          </div>
        ))}

        {/* Card adicionar */}
        <div
          className="card"
          role="button"
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderStyle: 'dashed', minHeight: 150, color: 'var(--gold-2)', fontWeight: 600 }}
        >
          + Adicionar barbeiro
        </div>
      </div>

      {/* Modal simples de cadastro */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={adicionar}
            className="card"
            style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <h3 style={{ margin: 0 }}>Adicionar barbeiro</h3>
            <div><label className="label">Nome</label><input className="input" value={form.nome} onChange={set('nome')} required /></div>
            <div><label className="label">Especialidade</label><input className="input" value={form.especialidade} onChange={set('especialidade')} /></div>
            <div><label className="label">Telefone</label><input className="input" value={form.telefone} onChange={set('telefone')} /></div>
            <div><label className="label">E-mail (login)</label><input className="input" type="email" value={form.email} onChange={set('email')} required /></div>
            <div><label className="label">Senha inicial</label><input className="input" type="password" value={form.senha} onChange={set('senha')} required /></div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary">Adicionar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
