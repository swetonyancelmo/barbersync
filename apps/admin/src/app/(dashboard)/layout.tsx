'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { BarberAvatar } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconBell,
  IconCalendar,
  IconChart,
  IconHours,
  IconLink,
  IconMenu,
  IconMoney,
  IconScissors,
  IconTag,
  IconUsers,
} from '@/components/icons';

const MENU = [
  { href: '/agenda', label: 'Agenda', Icon: IconCalendar },
  { href: '/solicitacoes', label: 'Solicitações', Icon: IconBell, badge: true },
  { href: '/clientes', label: 'Clientes', Icon: IconUsers },
  { href: '/financeiro', label: 'Financeiro', Icon: IconMoney },
  { href: '/relatorios', label: 'Relatórios', Icon: IconChart },
  { href: '/servicos', label: 'Serviços', Icon: IconTag },
  { href: '/horarios', label: 'Horários', Icon: IconHours },
  { href: '/equipe', label: 'Equipe', Icon: IconScissors },
  { href: '/link', label: 'Link de agendamento', Icon: IconLink },
];

// Botão "Sair" sobre o esmalte verde (contorno rosado)
const SAIR_CHROME =
  'border-[#eaa79d]/40 text-[#eaa79d] hover:bg-[#eaa79d]/15';

/** Marca + filete do poste + menu + usuário — reaproveitado na sidebar e no drawer. */
function ChromeContent({
  pathname,
  pendentes,
  nome,
  logout,
  showTheme,
}: {
  pathname: string;
  pendentes: number;
  nome: string;
  logout: () => void;
  showTheme: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-[22px] text-on-enamel">
        <IconScissors size={22} />
        <span className="display text-[22px]">BarberSync</span>
      </div>
      <div className="barber-rule mx-5 mb-3" />
      <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3">
        {MENU.map(({ href, label, Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative mb-[3px] flex items-center gap-3 rounded-lg px-3.5 py-[11px] text-sm font-semibold text-on-enamel/65 transition-colors hover:bg-white/[0.07] hover:text-on-enamel',
                active && 'bg-white/10 text-on-enamel',
              )}
            >
              {active && (
                <span className="barber-rule absolute inset-y-[7px] left-0 h-auto w-[3px] rounded-sm" />
              )}
              <Icon size={19} />
              <span className="flex-1">{label}</span>
              {badge && pendentes > 0 && (
                <span className="mono rounded-pill bg-pole px-[7px] py-px text-[11px] font-bold text-on-enamel">
                  {pendentes}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-on-enamel/15 p-4">
        <BarberAvatar nome={nome} size={38} />
        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-on-enamel">{nome}</div>
        {showTheme && <ThemeToggle chrome />}
        <Button variant="danger" size="sm" className={cn('h-8 px-3', SAIR_CHROME)} onClick={logout}>
          Sair
        </Button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendentes, setPendentes] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Fecha o menu mobile ao trocar de página.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const carregar = () =>
      api<unknown[]>('/appointments/pendentes')
        .then((r) => setPendentes(r.length))
        .catch(() => {});
    carregar();
    // Solicitações dispara este evento após confirmar/recusar.
    window.addEventListener('bs:pendentes-changed', carregar);
    return () => window.removeEventListener('bs:pendentes-changed', carregar);
  }, [user, pathname]);

  if (loading || !user) {
    return (
      <div className="space-y-3 p-10" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) = parede de esmalte verde da barbearia */}
      <aside className="sticky top-0 hidden h-dvh w-[250px] shrink-0 flex-col border-r-[3px] border-pole bg-pine min-[901px]:flex">
        <ChromeContent pathname={pathname} pendentes={pendentes} nome={user.nome} logout={logout} showTheme />
      </aside>

      {/* Conteúdo */}
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b-[3px] border-pole bg-pine px-[18px] py-[13px] min-[901px]:hidden">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="relative -my-1 -ml-1 inline-flex items-center justify-center rounded-input p-1 text-on-enamel focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus"
            >
              <IconMenu size={22} />
              {pendentes > 0 && (
                <span className="absolute right-px top-px size-2 rounded-pill border-[1.5px] border-pine bg-pole" />
              )}
            </button>
            <span className="display flex items-center gap-2 text-on-enamel">
              <IconScissors size={18} />
              BarberSync
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle chrome />
            <Button variant="danger" size="sm" className={cn('h-8 px-3', SAIR_CHROME)} onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        <div className="p-[18px] pb-8 min-[901px]:p-7">{children}</div>
      </main>

      {/* Drawer mobile (substitui a bottom nav que estourava com 8 abas) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="flex w-[264px] max-w-[82vw] flex-col gap-0 border-r-[3px] border-pole bg-pine p-0 text-on-enamel sm:max-w-[264px] [&>button:last-child]:right-3 [&>button:last-child]:top-5 [&>button:last-child]:text-on-enamel/70 [&>button:last-child]:hover:text-on-enamel"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação do painel</SheetDescription>
          <ChromeContent pathname={pathname} pendentes={pendentes} nome={user.nome} logout={logout} showTheme={false} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
