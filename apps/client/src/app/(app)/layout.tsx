'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { IconHome, IconScissors, IconUser } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

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
    return <div style={{ padding: 48, textAlign: 'center' }} className="muted">Carregando…</div>;
  }

  return (
    <div className="cli-shell">
      {/* Top bar (desktop) */}
      <header className="cli-topbar">
        <span className="cli-brand display">BarberSync</span>
        <nav className="cli-topnav">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`cli-topnav-item ${active ? 'is-active' : ''}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
          <ThemeToggle chrome />
        </nav>
      </header>

      <main className="cli-main">{children}</main>

      {/* Bottom bar (mobile) */}
      <nav className="cli-bottombar">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`cli-tab ${active ? 'is-active' : ''}`}>
              {active && <span className="cli-tab-rule barber-rule" />}
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        .cli-shell { min-height: 100dvh; }
        .cli-main {
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          padding-bottom: 92px;
        }
        .cli-topbar { display: none; }
        /* Barra inferior = friso de esmalte verde da barbearia */
        .cli-bottombar {
          position: fixed;
          bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 640px;
          display: flex;
          background: var(--pine);
          border-top: 3px solid var(--pole);
          box-shadow: 0 -8px 24px -14px rgba(30, 58, 51, 0.6);
          z-index: 20;
        }
        .cli-tab {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 12px 0 15px;
          color: rgba(244, 239, 224, 0.62);
          font-size: 11px;
          font-weight: 600;
        }
        .cli-tab.is-active { color: #f7f2e4; }
        .cli-tab-rule {
          position: absolute;
          top: -3px;
          width: 40px;
          height: 3px;
        }

        /* Desktop: vira barra superior de esmalte, esconde bottom bar */
        @media (min-width: 900px) {
          .cli-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--pine);
            border-bottom: 3px solid var(--pole);
            padding: 16px max(24px, calc((100% - 960px) / 2));
          }
          .cli-brand { font-size: 26px; letter-spacing: 0.6px; color: #f7f2e4; }
          .cli-topnav { display: flex; align-items: center; gap: 4px; }
          .cli-topnav-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 16px;
            border-radius: var(--r-pill);
            color: rgba(244, 239, 224, 0.68);
            font-weight: 600;
            font-size: 14px;
          }
          .cli-topnav-item:hover { color: #f7f2e4; background: rgba(255, 255, 255, 0.08); }
          .cli-topnav-item.is-active { color: #f7f2e4; background: var(--pole); }
          .cli-main { max-width: 760px; padding-bottom: 40px; padding-top: 8px; }
          .cli-bottombar { display: none; }
        }
      `}</style>
    </div>
  );
}
