'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { initials } from '@/lib/format';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  IconBell,
  IconCalendar,
  IconChart,
  IconHours,
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
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api<unknown[]>('/appointments/pendentes')
      .then((r) => setPendentes(r.length))
      .catch(() => {});
  }, [user, pathname]);

  if (loading || !user) {
    return <div style={{ padding: 40 }} className="muted">Carregando…</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#f7f2e4', display: 'inline-flex' }}><IconScissors size={22} /></span>
          <span className="display" style={{ fontSize: 22 }}>BarberSync</span>
        </div>
        <div className="barber-rule" style={{ margin: '0 20px 12px' }} />
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {MENU.map(({ href, label, Icon, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`side-item ${active ? 'is-active' : ''}`}>
                {active && <span className="side-rule barber-rule" />}
                <Icon size={19} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && pendentes > 0 && <span className="side-count mono">{pendentes}</span>}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid var(--oak-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>{initials(user.nome)}</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nome}</div>
          </div>
          <ThemeToggle chrome />
          <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={logout}>Sair</button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <header className="mobile-header">
          <span className="display" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#f7f2e4', display: 'inline-flex' }}><IconScissors size={18} /></span>
            BarberSync
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle chrome />
            <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={logout}>Sair</button>
          </div>
        </header>

        <div className="content-pad">{children}</div>

        <nav className="mobile-nav">
          {MENU.map(({ href, label, Icon, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`m-tab ${active ? 'is-active' : ''}`}>
                {active && <span className="m-rule barber-rule" />}
                <Icon size={19} />
                <span>{label}</span>
                {badge && pendentes > 0 && <span className="m-count mono">{pendentes}</span>}
              </Link>
            );
          })}
        </nav>
      </main>

      <style jsx global>{`
        /* Sidebar = parede de esmalte verde da barbearia */
        .sidebar {
          width: 250px; flex-shrink: 0; background: var(--pine);
          border-right: 3px solid var(--pole); display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100dvh;
        }
        .sidebar .display { color: #f7f2e4; }
        .side-item {
          position: relative; display: flex; align-items: center;
          gap: 12px; padding: 11px 14px; border-radius: 8px; margin-bottom: 3px;
          color: rgba(244, 239, 224, 0.66); font-weight: 600; font-size: 14px;
          transition: color 0.15s ease, background 0.15s ease;
        }
        .side-item:hover { color: #f7f2e4; background: rgba(255, 255, 255, 0.07); }
        .side-item.is-active { color: #f7f2e4; background: rgba(255, 255, 255, 0.1); }
        .side-rule { position: absolute; left: 0; top: 7px; bottom: 7px; width: 3px; height: auto; border-radius: 2px; }
        .side-count, .m-count {
          background: var(--pole); color: #f7f2e4;
          border-radius: 999px; font-size: 11px; padding: 1px 7px; font-weight: 700;
        }
        .sidebar .btn-danger, .mobile-header .btn-danger {
          color: #eaa79d; border-color: rgba(234, 167, 157, 0.42);
        }
        .sidebar .btn-danger:hover, .mobile-header .btn-danger:hover { background: rgba(234, 167, 157, 0.14); }
        .content-pad { padding: 28px; }
        .mobile-header, .mobile-nav { display: none; }

        @media (max-width: 900px) {
          .sidebar { display: none; }
          .mobile-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 13px 18px; border-bottom: 3px solid var(--pole);
            background: var(--pine); position: sticky; top: 0; z-index: 20;
          }
          .mobile-header .display { color: #f7f2e4; }
          .content-pad { padding: 18px; padding-bottom: 96px; }
          .mobile-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: var(--pine); border-top: 3px solid var(--pole);
            z-index: 20; overflow-x: auto;
          }
          .m-tab {
            position: relative; flex: 1 0 auto; min-width: 62px;
            display: flex; flex-direction: column; align-items: center; gap: 3px;
            padding: 10px 4px 12px; color: rgba(244, 239, 224, 0.62); font-size: 10px; font-weight: 600;
          }
          .m-tab.is-active { color: #f7f2e4; }
          .m-rule { position: absolute; top: -3px; width: 30px; height: 3px; }
          .m-count {
            position: absolute; top: 3px; right: 50%; margin-right: -20px;
            font-size: 9px; padding: 0 5px;
          }
        }
      `}</style>
    </div>
  );
}
