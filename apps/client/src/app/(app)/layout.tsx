'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { IconHome, IconScissors, IconUser } from '@/components/icons';

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
        .cli-bottombar {
          position: fixed;
          bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 640px;
          display: flex;
          background: rgba(14, 11, 7, 0.92);
          backdrop-filter: blur(8px);
          border-top: 1px solid var(--oak-soft);
          z-index: 20;
        }
        .cli-tab {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 11px 0 15px;
          color: var(--smoke);
          font-size: 11px;
          font-weight: 600;
        }
        .cli-tab.is-active { color: var(--brass-light); }
        .cli-tab-rule {
          position: absolute;
          top: 0;
          width: 34px;
          height: 3px;
        }

        /* Desktop: vira barra superior, esconde bottom bar */
        @media (min-width: 900px) {
          .cli-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            max-width: 960px;
            margin: 0 auto;
            padding: 18px 24px;
            border-bottom: 1px solid var(--oak-soft);
          }
          .cli-brand { font-size: 24px; letter-spacing: 0.5px; }
          .cli-topnav { display: flex; gap: 6px; }
          .cli-topnav-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 16px;
            border-radius: var(--r-pill);
            color: var(--smoke);
            font-weight: 600;
            font-size: 14px;
          }
          .cli-topnav-item:hover { color: var(--bone); background: var(--walnut); }
          .cli-topnav-item.is-active { color: var(--brass-light); background: var(--walnut); }
          .cli-main { max-width: 760px; padding-bottom: 40px; padding-top: 8px; }
          .cli-bottombar { display: none; }
        }
      `}</style>
    </div>
  );
}
