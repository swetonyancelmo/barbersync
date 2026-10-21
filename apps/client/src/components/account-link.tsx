'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { IconUser } from '@/components/icons';

/** "Entrar" ou "Minha conta" no topo das páginas públicas do link. */
export function AccountLink() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  if (loading) return null;

  const href = user ? '/perfil' : `/login?next=${encodeURIComponent(pathname)}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-pill px-3 py-2 text-sm font-semibold text-on-enamel/80 hover:bg-on-enamel/10 hover:text-on-enamel"
    >
      <IconUser size={18} />
      {user ? user.nome.split(' ')[0] : 'Entrar'}
    </Link>
  );
}
