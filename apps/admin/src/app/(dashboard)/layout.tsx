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
  IconClose,
  IconHours,
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
];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="hamburger"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <IconMenu size={22} />
              {pendentes > 0 && <span className="ham-dot" />}
            </button>
            <span className="display" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#f7f2e4', display: 'inline-flex' }}><IconScissors size={18} /></span>
              BarberSync
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle chrome />
            <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={logout}>Sair</button>
          </div>
        </header>

        <div className="content-pad">{children}</div>
      </main>

      {/* Drawer mobile (substitui a bottom nav que estourava com 8 abas) */}
      {menuOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="drawer-head">
              <span className="display" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20 }}>
                <span style={{ color: '#f7f2e4', display: 'inline-flex' }}><IconScissors size={20} /></span>
                BarberSync
              </span>
              <button className="drawer-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}>
                <IconClose size={22} />
              </button>
            </div>
            <div className="barber-rule" style={{ margin: '0 20px 12px' }} />
            <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
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
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f7f2e4' }}>{user.nome}</div>
              </div>
              <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={logout}>Sair</button>
            </div>
          </aside>
        </>
      )}

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
        .side-count {
          background: var(--pole); color: #f7f2e4;
          border-radius: 999px; font-size: 11px; padding: 1px 7px; font-weight: 700;
        }
        .sidebar .btn-danger, .mobile-header .btn-danger {
          color: #eaa79d; border-color: rgba(234, 167, 157, 0.42);
        }
        .sidebar .btn-danger:hover, .mobile-header .btn-danger:hover { background: rgba(234, 167, 157, 0.14); }
        .content-pad { padding: 28px; }
        .mobile-header, .hamburger { display: none; }

        /* Botão hambúrguer (chrome verde) */
        .hamburger {
          position: relative; background: transparent; border: none; cursor: pointer;
          color: #f7f2e4; padding: 4px; margin: -4px 0 -4px -4px;
          display: none; align-items: center; justify-content: center;
        }
        .ham-dot {
          position: absolute; top: 1px; right: 1px; width: 8px; height: 8px;
          border-radius: 999px; background: var(--pole); border: 1.5px solid var(--pine);
        }

        /* Drawer mobile */
        .drawer-backdrop {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
          z-index: 40; animation: bs-fade 0.15s ease;
        }
        .drawer {
          position: fixed; top: 0; left: 0; height: 100dvh; width: 264px; max-width: 82vw;
          background: var(--pine); border-right: 3px solid var(--pole);
          z-index: 41; display: flex; flex-direction: column;
          animation: bs-slide-in 0.18s ease;
        }
        .drawer .display { color: #f7f2e4; }
        .drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px 14px;
        }
        .drawer-close {
          background: transparent; border: none; cursor: pointer; padding: 4px;
          color: rgba(244, 239, 224, 0.7); display: inline-flex;
        }
        .drawer-close:hover { color: #f7f2e4; }
        .drawer .btn-danger { color: #eaa79d; border-color: rgba(234, 167, 157, 0.42); }
        .drawer .btn-danger:hover { background: rgba(234, 167, 157, 0.14); }
        @keyframes bs-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bs-slide-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        @media (max-width: 900px) {
          .sidebar { display: none; }
          .mobile-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 13px 18px; border-bottom: 3px solid var(--pole);
            background: var(--pine); position: sticky; top: 0; z-index: 20;
          }
          .mobile-header .display { color: #f7f2e4; }
          .hamburger { display: inline-flex; }
          .content-pad { padding: 18px; padding-bottom: 32px; }
        }
      `}</style>
    </div>
  );
}
