import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontBody, fontDisplay, fontMono } from './fonts';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'BarberSync · Painel',
  description: 'Painel de gestão da barbearia',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a33',
};

// Resolve o tema antes da pintura (evita flash): usa a escolha salva ou, na
// ausência dela, a preferência do sistema. Espelhado pelo <ThemeToggle>.
const themeScript = `(function(){try{var e=localStorage.getItem('bs-theme');if(e!=='light'&&e!=='dark'){e=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',e);}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
