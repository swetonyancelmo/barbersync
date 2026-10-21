'use client';

import { useEffect, useState } from 'react';
import { LoyaltyTier, Paginated } from '@barbersync/shared';
import { api } from '@/lib/api';
import { brl } from '@/lib/format';
import { TierBadge } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [loading, setLoading] = useState(true);

  // Busca nova volta para a página 1; o debounce cobre a digitação.
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
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
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h1 className="mb-2 mt-0 text-[28px]">Clientes</h1>
      <div className="barber-rule mb-5 w-[60px]" />

      <div className="mb-5 flex flex-wrap items-center gap-3.5">
        <div className="relative w-full max-w-[380px]">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden
          >
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou telefone…"
            aria-label="Buscar clientes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {total > 0 && (
          <span className="font-mono text-[13px] text-slate">
            {total} cliente{total === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        {loading && clientes.length === 0 ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : clientes.length === 0 ? (
          <p className="p-6 text-center text-slate">
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Última visita</TableHead>
                <TableHead>Total gasto</TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap font-semibold">{c.nome}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono">{c.telefone ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono">
                    {c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString('pt-BR') : '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-verd">{brl(c.totalGasto)}</TableCell>
                  <TableCell><TierBadge tier={c.tier} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label="Paginação">
          <Button
            variant="outline" size="icon" disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)} aria-label="Página anterior"
          >
            ‹
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant="outline"
              size="icon"
              className={n === page ? 'border-pole font-bold text-pole' : 'font-mono'}
              aria-current={n === page ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline" size="icon" disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)} aria-label="Próxima página"
          >
            ›
          </Button>
        </nav>
      )}
    </div>
  );
}
