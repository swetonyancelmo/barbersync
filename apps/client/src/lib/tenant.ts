'use client';

import { useEffect, useState } from 'react';

const KEY = 'barbersync.client.tenant';

export interface TenantOption {
  id: string;
  nome: string;
}

/**
 * Barbearia selecionada pelo cliente global. Persistida em localStorage —
 * o cliente pode agendar em várias barbearias, então a escolha é explícita.
 */
export function useSelectedTenant() {
  const [tenantId, setTenantIdState] = useState<string | null>(null);

  useEffect(() => {
    setTenantIdState(localStorage.getItem(KEY));
  }, []);

  const setTenantId = (id: string) => {
    localStorage.setItem(KEY, id);
    setTenantIdState(id);
  };

  return { tenantId, setTenantId };
}

export function getSelectedTenant(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}
