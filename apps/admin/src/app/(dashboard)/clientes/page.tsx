'use client';

import { useEffect, useState } from 'react';
import { LoyaltyTier } from '@barbersync/shared';
import { api } from '@/lib/api';
import { brl } from '@/lib/format';
import { TierBadge } from '@/components/ui';

interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  ultimaVisita: string | null;
  totalGasto: number;
  tier: LoyaltyTier;
}

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      api<Cliente[]>(`/users/clientes${q}`).then(setClientes).catch(() => setClientes([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Clientes</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      <input
        className="input"
        placeholder="Buscar por nome ou telefone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 380, marginBottom: 20 }}
      />

      <div className="card" style={{ padding: 0 }}>
        {clientes.length === 0 ? (
          <p className="muted" style={{ padding: 24, textAlign: 'center' }}>
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda.'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Nome</th><th>Telefone</th><th>Última visita</th><th>Total gasto</th><th>Tier</th></tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome}</td>
                    <td className="mono">{c.telefone ?? '—'}</td>
                    <td className="mono">{c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString('pt-BR') : '—'}</td>
                    <td className="mono" style={{ color: 'var(--brass-light)' }}>{brl(c.totalGasto)}</td>
                    <td><TierBadge tier={c.tier} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
