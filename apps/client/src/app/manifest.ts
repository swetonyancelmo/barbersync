import type { MetadataRoute } from 'next';

/**
 * Manifest da PWA — o Next injeta o <link rel="manifest"> automaticamente.
 * Cores vêm do tema Azulejaria: chrome verde-esmalte (--pine) e fundo porcelana.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BarberSync — Agende sua barbearia',
    short_name: 'BarberSync',
    description: 'Agende seu horário na barbearia, acompanhe sua fidelidade e histórico.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['lifestyle', 'productivity'],
    background_color: '#ece9dd',
    theme_color: '#1e3a33',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
