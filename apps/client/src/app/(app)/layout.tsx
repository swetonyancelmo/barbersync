'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { IconHome, IconScissors, IconUser } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/home', label: 'Início', Icon: IconHome },
  { href: '/agendar', label: 'Agendar', Icon: IconScissors },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center gap-3 p-12" role="status" aria-label="Carregando">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    /* env(safe-area-inset-*) só é != 0 com viewport-fit=cover — protege o
       conteúdo do notch e da barra de gestos quando instalado como PWA. */
    <div className="min-h-dvh pt-[env(safe-area-inset-top)]">
      {/* Top bar (desktop): barra superior de esmalte */}
      <header className="hidden items-center justify-between border-b-[3px] border-pole bg-pine px-[max(24px,calc((100%_-_960px)/2))] py-4 min-[900px]:flex">
        <span className="font-display text-[26px] tracking-[0.6px] text-on-enamel">BarberSync</span>
        <nav className="flex items-center gap-1" aria-label="Principal">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-2 rounded-pill px-4 py-[9px] text-sm font-semibold text-on-enamel/70 hover:bg-white/10 hover:text-on-enamel',
                  active && 'bg-pole text-on-enamel hover:bg-pole',
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <ThemeToggle chrome />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[640px] pb-[calc(92px+env(safe-area-inset-bottom))] min-[900px]:max-w-[760px] min-[900px]:pb-10 min-[900px]:pt-2">
        {children}
      </main>

      {/* Bottom bar (mobile): friso de esmalte verde; o verde vaza até a borda e
          os itens sobem acima da barra de gestos. */}
      <nav
        aria-label="Principal"
        className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[640px] -translate-x-1/2 border-t-[3px] border-pole bg-pine pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-14px_rgba(30,58,51,0.6)] min-[900px]:hidden"
      >
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-[3px] pb-[15px] pt-3 text-[11px] font-semibold text-on-enamel/60',
                active && 'text-on-enamel',
              )}
            >
              {active && <span className="barber-rule absolute -top-[3px] h-[3px] w-10" />}
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
