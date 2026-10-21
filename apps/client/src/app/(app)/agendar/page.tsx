'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelectedTenant } from '@/lib/tenant';
import { SemBarbearia, useMinhasBarbearias } from '@/components/minhas-barbearias';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Aba "Agendar": o fluxo mora no link da barbearia (/<slug>/agendar).
 * Com barbearia atual, redireciona; sem, mostra onde o cliente já agendou.
 */
export default function AgendarPage() {
  const { barbearia, ready } = useSelectedTenant();
  const router = useRouter();
  const minhas = useMinhasBarbearias();

  useEffect(() => {
    if (ready && barbearia) router.replace(`/${barbearia.slug}/agendar`);
  }, [ready, barbearia, router]);

  if (!ready || barbearia) {
    return (
      <div className="p-6" role="status" aria-label="Carregando">
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="px-[18px] py-6">
      <h1 className="mb-2 text-[28px]">Agendar</h1>
      <div className="barber-rule mb-5 w-16" />
      <SemBarbearia lista={minhas} destino="agendar" />
    </div>
  );
}
