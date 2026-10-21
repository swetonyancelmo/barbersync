'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BarbeariaRef } from '@barbersync/shared';
import { api } from '@/lib/api';
import { IconScissors } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Hook: barbearias em que o cliente já agendou (null = carregando). */
export function useMinhasBarbearias() {
  const [lista, setLista] = useState<BarbeariaRef[] | null>(null);
  useEffect(() => {
    api<BarbeariaRef[]>('/tenants/minhas').then(setLista).catch(() => setLista([]));
  }, []);
  return lista;
}

/**
 * Estado "sem barbearia": o cliente abriu o app sem ter passado por um link.
 * Mostra onde ele já agendou ou explica que o link vem da barbearia.
 */
export function SemBarbearia({
  lista,
  destino = 'vitrine',
}: {
  lista: BarbeariaRef[] | null;
  /** 'agendar' leva direto ao fluxo; 'vitrine' à página da barbearia. */
  destino?: 'vitrine' | 'agendar';
}) {
  if (lista === null) return <Skeleton className="h-28 w-full" />;

  if (lista.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2.5 p-7 text-center">
        <span className="text-slate"><IconScissors size={28} /></span>
        <strong>Agende pelo link da sua barbearia</strong>
        <p className="text-sm text-slate">
          Peça o link de agendamento à barbearia — ele costuma estar na bio do Instagram
          ou no WhatsApp. Abrindo o link, ela fica salva aqui.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {lista.map((b) => (
        <BarbeariaLink key={b.id} barbearia={b} href={destino === 'agendar' ? `/${b.slug}/agendar` : `/${b.slug}`} />
      ))}
    </div>
  );
}

export function BarbeariaLink({
  barbearia,
  href,
  atual,
}: {
  barbearia: BarbeariaRef;
  href: string;
  atual?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={cn('flex items-center justify-between gap-3 p-3.5 hover:bg-tile-2', atual && 'border-pole')}>
        <div>
          <strong>{barbearia.nome}</strong>
          <p className="mono text-xs text-slate">app.barbersync.com/{barbearia.slug}</p>
        </div>
        <span className="text-sm font-semibold text-pole">Abrir</span>
      </Card>
    </Link>
  );
}
