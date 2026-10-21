'use client';

import { useEffect } from 'react';
import type { BarbeariaRef } from '@barbersync/shared';
import { rememberBarbearia } from '@/lib/tenant';

/** Marca a barbearia do link aberto como a "atual" do cliente (sem UI). */
export function RememberBarbearia({ barbearia }: { barbearia: BarbeariaRef }) {
  useEffect(() => {
    rememberBarbearia(barbearia);
  }, [barbearia.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
