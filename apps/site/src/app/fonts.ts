import { Fjalla_One, Hanken_Grotesk, Space_Mono } from 'next/font/google';

/** Três vozes tipográficas do BarberSync (tema "Azulejaria"). */
export const fontDisplay = Fjalla_One({
  subsets: ['latin'],
  weight: ['400'],
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
