'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppointmentStatus, PublicBarbearia } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { fetchBarbearia } from '@/lib/public-api';
import { useSelectedTenant } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge } from '@/components/ui';
import {
  BarbeariaLink,
  SemBarbearia,
  useMinhasBarbearias,
} from '@/components/minhas-barbearias';
import { IconStar, IconReceipt } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Agendamento {
  id: string;
  dataHora: string;
  status: AppointmentStatus;
  valorTotal: number;
  barbeiro: { user: { nome: string } };
  servicos: { nome: string }[];
}

export default function HomePage() {
  const { user } = useAuth();
  const { barbearia, ready, setBarbearia } = useSelectedTenant();
  const minhas = useMinhasBarbearias();

  const [vitrine, setVitrine] = useState<PublicBarbearia | null>(null);
  const [proximo, setProximo] = useState<Agendamento | null>(null);
  const [pontos, setPontos] = useState<number>(0);

  useEffect(() => {
    api<Agendamento | null>('/appointments/me/proximo').then(setProximo).catch(() => {});
  }, []);

  // Sem link aberto ainda: assume a primeira barbearia onde ele já agendou.
  useEffect(() => {
    if (ready && !barbearia && minhas?.[0]) setBarbearia(minhas[0]);
  }, [ready, barbearia, minhas, setBarbearia]);

  useEffect(() => {
    if (!barbearia) return;
    fetchBarbearia(barbearia.slug).then(setVitrine).catch(() => setVitrine(null));
    api<{ pontosAtuais: number }>(`/loyalty/me?tenantId=${barbearia.id}`)
      .then((r) => setPontos(r.pontosAtuais))
      .catch(() => setPontos(0));
  }, [barbearia]);

  const outras = (minhas ?? []).filter((b) => b.id !== barbearia?.id);

  return (
    <div className="px-[18px] py-6">
      <header className="mb-[22px] flex items-center justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.08em] text-slate">Olá,</p>
          <h1 className="text-[30px]">{user?.nome?.split(' ')[0]}</h1>
        </div>
        {barbearia && (
          <Badge variant="ouro">
            <IconStar size={13} /> <span className="mono">{pontos}</span> pts
          </Badge>
        )}
      </header>

      {/* Barbearia atual — a do último link aberto */}
      {ready && !barbearia ? (
        <div className="mb-6">
          <SemBarbearia lista={minhas} />
        </div>
      ) : (
        barbearia && (
          <div className="mb-5">
            <p className="mono mb-2 text-[11px] uppercase tracking-[0.08em] text-slate">Sua barbearia</p>
            <BarbeariaLink barbearia={barbearia} href={`/${barbearia.slug}`} atual />
          </div>
        )
      )}

      {/* Próximo agendamento — card em formato de comanda */}
      <h3 className="mb-2.5 text-lg">Próximo agendamento</h3>
      {proximo ? (
        <div className="ticket mb-6 p-5">
          <div className="flex items-start justify-between">
            <div>
              <strong className="text-base">{proximo.servicos.map((s) => s.nome).join(', ')}</strong>
              <p className="mt-1 text-sm text-slate">com {proximo.barbeiro.user.nome}</p>
            </div>
            <StatusBadge status={proximo.status} />
          </div>
          <div className="ticket-perf" />
          <div className="flex items-center justify-between">
            <span className="mono text-[15px] text-verd">{formatDateTime(proximo.dataHora)}</span>
            <span className="mono text-[15px]">{brl(Number(proximo.valorTotal))}</span>
          </div>
        </div>
      ) : (
        <Card className="mb-6 flex flex-col items-center gap-2.5 p-7 text-center">
          <span className="text-slate"><IconReceipt size={28} /></span>
          <p className="text-slate">Você não tem agendamentos futuros.</p>
        </Card>
      )}

      {barbearia && (
        <Button asChild className="mb-7 w-full">
          <Link href={`/${barbearia.slug}/agendar`}>Reservar novo horário</Link>
        </Button>
      )}

      {vitrine && (
        <>
          {/* Barbeiros */}
          <h3 className="mb-2.5 text-lg">Nossos barbeiros</h3>
          {vitrine.barbeiros.length === 0 ? (
            <p className="mb-7 text-sm text-slate">Nenhum barbeiro disponível nesta barbearia.</p>
          ) : (
            <div className="mb-7 flex flex-col gap-2.5">
              {vitrine.barbeiros.map((b) => (
                <Card key={b.id} className="flex items-center gap-3 p-3.5">
                  <BarberAvatar nome={b.nome} />
                  <div className="flex-1">
                    <strong>{b.nome}</strong>
                    <p className="text-[13px] text-slate">{b.especialidade ?? 'Barbeiro'}</p>
                  </div>
                  <Badge variant="ouro">
                    <IconStar size={12} /> <span className="mono">{b.rating.toFixed(1)}</span>
                  </Badge>
                </Card>
              ))}
            </div>
          )}

          {/* Serviços */}
          <h3 className="mb-2.5 text-lg">Serviços</h3>
          {vitrine.servicos.length === 0 ? (
            <p className="mb-7 text-sm text-slate">Nenhum serviço cadastrado.</p>
          ) : (
            <div className="mb-7 flex flex-col gap-2.5">
              {vitrine.servicos.map((s) => (
                <Card key={s.id} className="flex justify-between p-3.5">
                  <div>
                    <strong>{s.nome}</strong>
                    <p className="mono text-xs text-slate">{s.duracaoMin} min</p>
                  </div>
                  <strong className="mono text-verd">{brl(s.preco)}</strong>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Outras barbearias onde o cliente já agendou (cliente global) */}
      {outras.length > 0 && (
        <>
          <h3 className="mb-2.5 text-lg">Outras barbearias</h3>
          <div className="flex flex-col gap-2.5">
            {outras.map((b) => (
              <BarbeariaLink key={b.id} barbearia={b} href={`/${b.slug}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
