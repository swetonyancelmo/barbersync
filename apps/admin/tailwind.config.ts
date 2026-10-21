import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * Tailwind mapeado nos tokens "Azulejaria" (globals.css é a fonte da verdade).
 *
 * Cores: `c('x')` -> color-mix com <alpha-value>, então `bg-pole/90`, `text-ink/60`,
 * `border-line/50` funcionam mesmo com tokens em hex.
 *
 * Dark mode: os tokens já trocam sozinhos (`:root[data-theme='dark']` + fallback
 * `@media (prefers-color-scheme: dark)`), então as cores se adaptam SEM variantes `dark:`.
 * A variante `dark:` (seletor [data-theme="dark"]) é secundária e só reflete o tema
 * escolhido explicitamente/resolvido pelo script inline — não segue o fallback de mídia.
 * Prefira sempre tokens a `dark:`.
 *
 * Atenção: `slate` aqui é o texto secundário da marca e SOBRESCREVE a paleta `slate-*`
 * padrão do Tailwind (use apenas `text-slate`, `bg-slate/15`...).
 */
const c = (v: string) => `color-mix(in srgb, var(--${v}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ---- semântica shadcn ----
        background: c('background'),
        foreground: c('foreground'),
        card: { DEFAULT: c('card'), foreground: c('card-foreground') },
        popover: { DEFAULT: c('popover'), foreground: c('popover-foreground') },
        primary: { DEFAULT: c('primary'), foreground: c('primary-foreground') },
        secondary: { DEFAULT: c('secondary'), foreground: c('secondary-foreground') },
        muted: { DEFAULT: c('muted'), foreground: c('muted-foreground') },
        accent: { DEFAULT: c('accent'), foreground: c('accent-foreground') },
        destructive: { DEFAULT: c('destructive'), foreground: c('destructive-foreground') },
        border: c('border'),
        input: c('input'),
        ring: c('ring'),
        // ---- marca Azulejaria ----
        porcelain: c('porcelain'),
        tile: c('tile'),
        'tile-2': c('tile-2'),
        paper: c('paper'),
        'paper-2': c('paper-2'),
        line: c('line'),
        'line-soft': c('line-soft'),
        ink: c('ink'),
        slate: c('slate'),
        pine: c('pine'),
        'pine-2': c('pine-2'),
        verd: c('verd'),
        'verd-2': c('verd-2'),
        pole: c('pole'),
        'pole-2': c('pole-2'),
        'pole-bright': c('pole-bright'),
        navy: c('navy'),
        brass: c('brass'),
        ok: c('ok'),
        danger: c('danger'),
        'tier-ouro': c('tier-ouro'),
        'tier-prata': c('tier-prata'),
        'tier-bronze': c('tier-bronze'),
        'on-enamel': c('on-enamel'),
        'on-pole': c('on-pole'),
        // cor de anel de foco (já é rgba no token) -> `ring-focus`
        focus: 'var(--focus)',
      },
      // Preflight usa borderColor.DEFAULT: bordas sem cor explícita = rejunte
      borderColor: { DEFAULT: c('border') },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        ticket: 'var(--r-ticket)',
        input: 'var(--r-input)',
        card: 'var(--r-card)',
        pill: '999px',
        // aliases shadcn (--radius = --r-card)
        lg: 'var(--r-card)',
        md: 'var(--r-input)',
        sm: 'calc(var(--r-input) - 4px)',
      },
      boxShadow: {
        hairline: 'var(--elev-hairline)',
        raised: 'var(--elev-raised)',
        float: 'var(--elev-float)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

export default config;
