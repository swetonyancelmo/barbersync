# BarberSync — kit de logo

## Onde usar cada arquivo
- favicon/ → copie tudo para `apps/client/public` e `apps/admin/public` (ou para `app/` no App Router)
- svg/barbersync-logo-horizontal-dark-bg.svg → navbar (tema escuro)
- svg/barbersync-logo-horizontal-light-bg.svg → navbar (tema claro)
- svg/barbersync-logo-stacked-*.svg → login, splash, e-mails
- svg/barbersync-icon-mono.svg → usa `currentColor`, herda a cor do CSS
- png/ → e-mails, redes sociais, onde SVG não for aceito

## Next.js 14 (app/layout.tsx)
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#17120E',
};

## Paleta
Fundo #17120E · Creme #F0E6D2 · Coral #D9503F · Verde #5E9C86 · Azul #3A5A9C
Claro: Tinta #1B1510 · Coral #B83A2B · Verde #2F6553 · Fundo #F3EBDC
