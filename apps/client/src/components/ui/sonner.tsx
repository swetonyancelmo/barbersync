'use client';

import * as React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Sem next-themes: lê o data-theme do <html> (definido pelo script inline/ThemeToggle)
// e cai em "system" quando não há escolha explícita.
function useDocTheme(): 'light' | 'dark' | 'system' {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');
  React.useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute('data-theme');
      setTheme(t === 'light' || t === 'dark' ? t : 'system');
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useDocTheme();
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:rounded-card group-[.toaster]:border-line group-[.toaster]:bg-tile group-[.toaster]:text-ink group-[.toaster]:shadow-float group-[.toaster]:font-body',
          description: 'group-[.toast]:text-slate',
          actionButton: 'group-[.toast]:rounded-pill group-[.toast]:bg-pole group-[.toast]:text-on-pole',
          cancelButton: 'group-[.toast]:rounded-pill group-[.toast]:bg-tile-2 group-[.toast]:text-slate',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
