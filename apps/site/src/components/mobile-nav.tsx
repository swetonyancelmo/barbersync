'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export type NavLink = { href: string; label: string };

/** Menu hambúrguer (Sheet) — só aparece abaixo de md, onde os links da navbar somem. */
export function MobileNav({ links, loginHref, signupHref }: { links: NavLink[]; loginHref: string; signupHref: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="md:hidden" aria-label="Abrir menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação da página</SheetDescription>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((l) => (
            <SheetClose key={l.href} asChild>
              <a
                href={l.href}
                className="rounded-input px-3 py-3 font-semibold text-ink transition-colors hover:bg-tile-2"
              >
                {l.label}
              </a>
            </SheetClose>
          ))}
          <a
            href={loginHref}
            className="rounded-input px-3 py-3 font-bold text-ink transition-colors hover:bg-tile-2"
          >
            Entrar
          </a>
        </nav>
        <SheetClose asChild>
          <Button asChild className="mt-6 w-full">
            <a href={signupHref}>Cadastre sua barbearia</a>
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
