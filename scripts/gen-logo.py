"""Gera apps/{client,admin,site}/src/components/logo.tsx a partir dos SVGs do kit
em barbersync-brand/svg. Uso: python3 scripts/gen-logo.py"""
import re, json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = ROOT / 'barbersync-brand' / 'svg'

# cor fixa (versão para fundo claro) -> variável CSS
CORES = {
    '#1B1510': 'var(--logo-ink)',
    '#2F6553': 'var(--logo-green)',
    '#B83A2B': 'var(--logo-coral)',
    '#3A5A9C': 'var(--logo-navy)',
    '#FFFFFF': 'var(--logo-paper)',
}

def inner(nome):
    src = (SVG / nome).read_text()
    m = re.match(r'\s*<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>\s*$', src, re.S)
    viewbox, body = m.group(1), m.group(2).strip()
    def troca(mm):
        attr, cor = mm.group(1), mm.group(2).upper()
        if cor not in CORES:
            sys.exit(f'cor inesperada {cor} em {nome}')
        return f'style="{attr}:{CORES[cor]}"'
    body = re.sub(r'(fill|stroke)="(#[0-9A-Fa-f]{6})"', troca, body)
    body = re.sub(r'\s*\n\s*', '', body)
    return viewbox, body

variantes = {
    'icon': inner('barbersync-icon-light-bg.svg'),
    'horizontal': inner('barbersync-logo-horizontal-light-bg.svg'),
    'stacked': inner('barbersync-logo-stacked-light-bg.svg'),
}

dados = ',\n'.join(
    f"  {k}: {{ viewBox: {json.dumps(v)}, markup: {json.dumps(b)} }}"
    for k, (v, b) in variantes.items()
)

TSX = f"""/**
 * Logo oficial do BarberSync (kit em /barbersync-brand). ARQUIVO GERADO a
 * partir dos SVGs do kit — para atualizar a marca, troque os SVGs e rode o
 * scripts/gen-logo.py em vez de editar os paths à mão. Mesmo arquivo em
 * apps/client, apps/admin e apps/site.
 *
 * As cores saem de variáveis CSS (--logo-ink/green/coral/navy/paper,
 * definidas em globals.css): a logo acompanha o tema claro/escuro sozinha.
 * `tone="on-dark"` força a versão para fundo escuro — use sobre o chrome
 * verde-esmalte (nav, sidebar), que é escuro nos dois temas.
 */

const VARIANTES = {{
{dados},
}} as const;

export type LogoVariant = keyof typeof VARIANTES;

export function Logo({{
  variant = 'horizontal',
  tone = 'auto',
  className,
  title = 'BarberSync',
}}: {{
  /** horizontal = navbar/sidebar · stacked = login/splash · icon = só a tesoura */
  variant?: LogoVariant;
  tone?: 'auto' | 'on-dark';
  /** Controle o tamanho pela altura (ex.: "h-8 w-auto"). */
  className?: string;
  /** Nome acessível; passe "" quando houver texto "BarberSync" ao lado. */
  title?: string;
}}) {{
  const v = VARIANTES[variant];
  const decorativo = title === '';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={{v.viewBox}}
      className={{['bs-logo', tone === 'on-dark' && 'bs-logo-on-dark', className].filter(Boolean).join(' ')}}
      role={{decorativo ? undefined : 'img'}}
      aria-label={{decorativo ? undefined : title}}
      aria-hidden={{decorativo || undefined}}
      focusable="false"
      // Markup estático do próprio kit (constante acima), sem entrada de usuário.
      dangerouslySetInnerHTML={{{{ __html: v.markup }}}}
    />
  );
}}
"""

for app in ('client', 'admin', 'site'):
    out = ROOT / 'apps' / app / 'src' / 'components' / 'logo.tsx'
    out.write_text(TSX)
    print('ok', out, len(TSX))
