'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppointmentStatus } from '@barbersync/shared';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useSelectedTenant, TenantOption } from '@/lib/tenant';
import { brl, formatDateTime } from '@/lib/format';
import { BarberAvatar, StatusBadge } from '@/components/ui';
import { IconStar, IconReceipt } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Barbeiro {
  id: string;
  especialidade: string | null;
  rating: number;
  user: { nome: string };
}
interface Servico {
  id: string;
  nome: string;
  duracaoMin: number;
  preco: number;
}
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
  const { tenantId, setTenantId } = useSelectedTenant();

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [proximo, setProximo] = useState<Agendamento | null>(null);
  const [pontos, setPontos] = useState<number>(0);

  useEffect(() => {
    api<TenantOption[]>('/tenants').then((list) => {
      setTenants(list);
      if (!tenantId && list[0]) setTenantId(list[0].id);
    });
    api<Agendamento | null>('/appointments/me/proximo').then(setProximo).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tenantId) return;
    api<Barbeiro[]>(`/barbers?tenantId=${tenantId}`).then(setBarbeiros).catch(() => setBarbeiros([]));
    api<Servico[]>(`/services?tenantId=${tenantId}`).then(setServicos).catch(() => setServicos([]));
    api<{ pontosAtuais: number }>(`/loyalty/me?tenantId=${tenantId}`)
      .then((r) => setPontos(r.pontosAtuais))
      .catch(() => setPontos(0));
  }, [tenantId]);

  return (
    <div className="px-[18px] py-6">
      <header className="mb-[22px] flex items-center justify-between">
        <div>
          <p className="text-[13px] uppercase tracking-[0.08em] text-slate">Olá,</p>
          <h1 className="text-[30px]">{user?.nome?.split(' ')[0]}</h1>
        </div>
        <Badge variant="ouro">
          <IconStar size={13} /> <span className="mono">{pontos}</span> pts
        </Badge>
      </header>

      {/* Seletor de barbearia (cliente global) */}
      <Label htmlFor="barbearia">Barbearia</Label>
      <Select value={tenantId ?? ''} onValueChange={(v) => setTenantId(v)}>
        <SelectTrigger id="barbearia" className="mb-5">
          <SelectValue placeholder="Selecione a barbearia" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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

      <Button asChild className="mb-7 w-full">
        <Link href="/agendar">Reservar novo horário</Link>
      </Button>

      {/* Barbeiros */}
      <h3 className="mb-2.5 text-lg">Nossos barbeiros</h3>
      {barbeiros.length === 0 ? (
        <p className="text-sm text-slate">Nenhum barbeiro disponível nesta barbearia.</p>
      ) : (
        <div className="mb-7 flex flex-col gap-2.5">
          {barbeiros.map((b) => (
            <Card key={b.id} className="flex items-center gap-3 p-3.5">
              <BarberAvatar nome={b.user.nome} />
              <div className="flex-1">
                <strong>{b.user.nome}</strong>
                <p className="text-[13px] text-slate">{b.especialidade ?? 'Barbeiro'}</p>
              </div>
              <Badge variant="ouro">
                <IconStar size={12} /> <span className="mono">{Number(b.rating).toFixed(1)}</span>
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Serviços */}
      <h3 className="mb-2.5 text-lg">Serviços</h3>
      {servicos.length === 0 ? (
        <p className="text-sm text-slate">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {servicos.map((s) => (
            <Card key={s.id} className="flex justify-between p-3.5">
              <div>
                <strong>{s.nome}</strong>
                <p className="mono text-xs text-slate">{s.duracaoMin} min</p>
              </div>
              <strong className="mono text-verd">{brl(Number(s.preco))}</strong>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
