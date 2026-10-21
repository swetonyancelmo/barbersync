'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconMoon, IconSun } from './icons';

type Theme = 'light' | 'dark';

/** Alterna claro/escuro (mesmo padrão dos apps: tema resolvido por script inline). */
export function ThemeToggle() {
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
      /* localStorage indisponível */
    }
    setTheme(next);
  }

  const escuro = theme === 'dark';
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className="size-[38px] shrink-0 text-slate hover:text-verd"
      onClick={toggle}
      aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <IconSun size={18} /> : <IconMoon size={18} />}
    </Button>
  );
}
