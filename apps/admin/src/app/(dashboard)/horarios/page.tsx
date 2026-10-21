'use client';

import { useEffect, useState } from 'react';
import { UserRole } from '@barbersync/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BarbeariaForm } from './barbearia-form';
import { BarbeiroForm } from './barbeiro-form';

interface Barbeiro { id: string; ativo: boolean; user: { nome: string }; }

const BARBEARIA = 'barbearia';

/** Horários: o expediente da barbearia e, por cima dele, o de cada barbeiro. */
export default function HorariosPage() {
  const { user } = useAuth();
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [alvo, setAlvo] = useState<string>(BARBEARIA);

  useEffect(() => {
    api<Barbeiro[]>('/barbers')
      .then((list) => setBarbeiros(list.filter((b) => b.ativo)))
      .catch(() => setBarbeiros([]));
  }, []);

  const barbeiro = barbeiros.find((b) => b.id === alvo);

  return (
    <div className="max-w-[720px]">
      <h1 className="m-0 text-[28px]">Horários</h1>
      <div className="barber-rule my-2 w-[60px]" />

      <ToggleGroup
        type="single"
        value={alvo}
        onValueChange={(v) => v && setAlvo(v)}
        aria-label="De quem é o horário"
        className="no-scrollbar mb-4 mt-3 justify-start gap-2 overflow-x-auto pb-1"
      >
        <ToggleGroupItem value={BARBEARIA} variant="outline" className="shrink-0 rounded-pill px-4">
          Barbearia
        </ToggleGroupItem>
        {barbeiros.map((b) => (
          <ToggleGroupItem key={b.id} value={b.id} variant="outline" className="shrink-0 rounded-pill px-4">
            {b.user.nome}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {barbeiro ? (
        <BarbeiroForm
          key={barbeiro.id}
          barbeiroId={barbeiro.id}
          nome={barbeiro.user.nome}
          podeEditar={user?.role === UserRole.ADMIN}
        />
      ) : (
        <BarbeariaForm />
      )}
    </div>
  );
}
