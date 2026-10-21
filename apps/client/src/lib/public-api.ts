import type { PublicBarbearia } from '@barbersync/shared';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

/**
 * Vitrine pública da barbearia (sem token). Roda no servidor (página /<slug>,
 * metadata do link) e no client. null = slug não existe.
 */
export async function fetchBarbearia(slug: string): Promise<PublicBarbearia | null> {
  const res = await fetch(`${API_URL}/public/barbearias/${encodeURIComponent(slug)}`, {
    // Serviços/preços mudam pouco; 60s de cache deixa o link rápido no Instagram.
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Falha ao carregar a barbearia.');
  return res.json();
}

export interface Slot { hora: string; disponivel: boolean; }
export interface Grade { aberto: boolean; manha: Slot[]; tarde: Slot[]; }

export async function fetchDisponibilidade(
  slug: string,
  barbeiroId: string,
  data: string,
): Promise<Grade> {
  const qs = new URLSearchParams({ barbeiroId, data });
  const res = await fetch(
    `${API_URL}/public/barbearias/${encodeURIComponent(slug)}/disponibilidade?${qs}`,
    { cache: 'no-store' },
  );
  if (!res.ok) throw new Error('Falha ao carregar os horários.');
  return res.json();
}
