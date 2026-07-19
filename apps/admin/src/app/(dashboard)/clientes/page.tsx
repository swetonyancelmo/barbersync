'use client';

import { useEffect, useState } from 'react';
import { LoyaltyTier, Paginated } from '@barbersync/shared';
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

const LIMIT = 20;

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);

  // Busca nova volta para a página 1; o debounce cobre a digitação.
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search) params.set('search', search);
      api<Paginated<Cliente>>(`/users/clientes?${params}`)
        .then((p) => {
          setClientes(p.items);
          setTotal(p.total);
        })
        .catch(() => {
          setClientes([]);
          setTotal(0);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [search, page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 8 }}>Clientes</h1>
      <div className="barber-rule" style={{ width: 60, marginBottom: 20 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar por nome ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 380 }}
        />
        {total > 0 && (
          <span className="muted mono" style={{ fontSize: 13 }}>
            {total} cliente{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

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

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className="btn-outline mono"
              onClick={() => setPage(n)}
              style={
                n === page
                  ? { borderColor: 'var(--pole)', color: 'var(--pole)', fontWeight: 700 }
                  : undefined
              }
            >
              {n}
            </button>
          ))}
          <button
            className="btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
