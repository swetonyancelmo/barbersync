import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { AccountLink } from '@/components/account-link';

/**
 * Casca das páginas do link da barbearia (/<slug>, /<slug>/agendar).
 * Pública de propósito: sem bottom nav e sem guard de login — quem chega pelo
 * Instagram navega à vontade e só entra na conta para confirmar o horário.
 */
export default function BarbeariaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return (
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-pole bg-pine px-[max(18px,calc((100%_-_760px)/2))] py-3">
        <Link href={`/${params.slug}`} aria-label="BarberSync — página da barbearia">
          <Logo tone="on-dark" title="" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-1">
          <AccountLink />
          <ThemeToggle chrome />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] min-[900px]:max-w-[760px]">{children}</main>
    </div>
  );
}
