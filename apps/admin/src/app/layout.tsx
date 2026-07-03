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
  themeColor: '#0e0b07',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
