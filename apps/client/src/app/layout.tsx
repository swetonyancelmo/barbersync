import type { Metadata, Viewport } from 'next';
import './globals.css';
import { fontBody, fontDisplay, fontMono } from './fonts';
import { AuthProvider } from '@/lib/auth';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'BarberSync',
  description: 'Agende seu horário na barbearia',
  applicationName: 'BarberSync',
  // iOS não lê o manifest: precisa destas metas para abrir em tela cheia.
  appleWebApp: { capable: true, title: 'BarberSync', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Usa a tela toda no app instalado; as telas compensam com env(safe-area-inset-*).
  viewportFit: 'cover',
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
        <PwaRegister />
        <AuthProvider>
          <div id="app-root">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
