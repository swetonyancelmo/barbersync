'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BarbeariaRef } from '@barbersync/shared';

const KEY = 'barbersync.client.barbearia';
/** Formato antigo (só o id, escolhido num seletor). Descartado: não tem slug. */
const LEGACY_KEY = 'barbersync.client.tenant';

function read(): BarbeariaRef | null {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BarbeariaRef) : null;
  } catch {
    return null;
  }
}

/**
 * Barbearia "atual" do cliente global — a do último link aberto
 * (app.barbersync.com/<slug>) ou escolhida em "minhas barbearias".
 * Persistida em localStorage para o app abrir direto nela na próxima visita.
 */
export function useSelectedTenant() {
  const [barbearia, setState] = useState<BarbeariaRef | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
  }, []);

  const setBarbearia = useCallback((b: BarbeariaRef) => {
    rememberBarbearia(b);
    setState(b);
  }, []);

  return { barbearia, tenantId: barbearia?.id ?? null, ready, setBarbearia };
}

export function rememberBarbearia(b: BarbeariaRef) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: b.id, nome: b.nome, slug: b.slug }));
  } catch {
    /* modo privado / storage bloqueado: só não lembra */
  }
}
