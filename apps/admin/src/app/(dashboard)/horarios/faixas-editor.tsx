'use client';

import type { Bloco } from '@barbersync/shared';
import { IconPlus } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Editor das faixas de um dia (início/fim), usado na barbearia e no barbeiro. */
export function FaixasEditor({
  blocos,
  onChange,
  novaFaixa = { inicio: '09:00', fim: '12:00' },
}: {
  blocos: Bloco[];
  onChange: (blocos: Bloco[]) => void;
  novaFaixa?: Bloco;
}) {
  const set = (idx: number, campo: keyof Bloco, valor: string) =>
    onChange(blocos.map((b, i) => (i === idx ? { ...b, [campo]: valor } : b)));

  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      {blocos.map((b, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2.5">
          <Input
            type="time"
            aria-label="Início"
            className="min-w-0 max-w-[130px] flex-[1_1_120px] font-mono"
            value={b.inicio}
            onChange={(e) => set(i, 'inicio', e.target.value)}
          />
          <span className="text-slate">até</span>
          <Input
            type="time"
            aria-label="Fim"
            className="min-w-0 max-w-[130px] flex-[1_1_120px] font-mono"
            value={b.fim}
            onChange={(e) => set(i, 'fim', e.target.value)}
          />
          <Button
            variant="danger"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => onChange(blocos.filter((_, j) => j !== i))}
          >
            Remover
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => onChange([...blocos, novaFaixa])}
      >
        <IconPlus size={15} /> Adicionar faixa
      </Button>
    </div>
  );
}

/** "09:00–12:00 · 13:00–19:00" */
export function faixasTexto(blocos: Bloco[]): string {
  return blocos.map((b) => `${b.inicio}–${b.fim}`).join(' · ');
}
