import { Bodoni_Moda, Hanken_Grotesk, Space_Mono } from 'next/font/google';

/**
 * Três vozes tipográficas do BarberSync (self-hosted, sem CSP):
 *  - display: Bodoni Moda (Didone de alto contraste — letreiro de grooming clássico)
 *  - corpo:   Hanken Grotesk (grotesca humanista quente)
 *  - dados:   Space Mono (mono com pegada de comanda/ticket — horas, preços, números)
 */
export const fontDisplay = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['500', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const fontBody = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const fontMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});
