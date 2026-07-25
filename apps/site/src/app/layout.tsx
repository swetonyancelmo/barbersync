import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontBody, fontDisplay, fontMono } from './fonts';

export const metadata: Metadata = {
  title: 'BarberSync — Sistema de agendamento para barbearias',
  description:
    'Agenda, fidelidade, financeiro e relatórios da sua barbearia num só lugar. Seus clientes agendam sozinhos; você controla tudo pelo painel.',
  applicationName: 'BarberSync',
  keywords: [
    'agendamento barbearia',
    'sistema para barbearia',
    'software barbearia',
    'agenda online barbearia',
    'fidelidade barbearia',
  ],
  openGraph: {
    title: 'BarberSync — Sistema de agendamento para barbearias',
    description:
      'Agenda, fidelidade, financeiro e relatórios da sua barbearia num só lugar.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'BarberSync',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e3a33',
};

// Resolve o tema antes da pintura (evita flash) — mesmo padrão dos apps.
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
        <div id="site-root">{children}</div>
      </body>
    </html>
  );
}
