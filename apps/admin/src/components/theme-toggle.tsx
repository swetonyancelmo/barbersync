'use client';

import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from './icons';

type Theme = 'light' | 'dark';

/**
 * Alterna claro/escuro. O tema inicial é resolvido antes da hidratação por um
 * script inline no root layout (lê `bs-theme` do localStorage; se vazio, segue
 * o sistema) e escrito em `data-theme` no <html>. Aqui só espelhamos e trocamos.
 */
export function ThemeToggle({ chrome = false }: { chrome?: boolean }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('bs-theme', next);
    } catch {
      /* localStorage indisponível — troca vale só nesta sessão */
    }
    setTheme(next);
  }

  const escuro = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className={`theme-toggle${chrome ? ' on-chrome' : ''}`}
      aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}
