'use client';

import { useEffect } from 'react';

/**
 * Registra o service worker (public/sw.js).
 *
 * Só em produção: em dev o SW interceptaria os assets do HMR e serviria código
 * velho — a fonte clássica de "mudei e não atualiza". Para testar a PWA, use um
 * build de produção (ou o deploy), não o `npm run dev`.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* PWA é progressiva: se falhar, o app segue funcionando normalmente. */
      });
    };

    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
