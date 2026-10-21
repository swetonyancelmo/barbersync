import type * as React from 'react';
import { AppointmentStatus, LoyaltyTier, PaymentMethod } from '@barbersync/shared';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function BarberAvatar({ nome, size = 44 }: { nome: string; size?: number }) {
  return (
    <Avatar style={{ width: size, height: size }}>
      <AvatarFallback style={{ fontSize: size * 0.36 }}>{initials(nome)}</AvatarFallback>
    </Avatar>
  );
}

type BadgeVariant = NonNullable<React.ComponentProps<typeof Badge>['variant']>;

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDENTE]: 'Pendente',
  [AppointmentStatus.CONFIRMADO]: 'Confirmado',
  [AppointmentStatus.CONCLUIDO]: 'Concluído',
  [AppointmentStatus.RECUSADO]: 'Recusado',
};
const STATUS_CLASS: Record<AppointmentStatus, BadgeVariant> = {
  [AppointmentStatus.PENDENTE]: 'pending',
  [AppointmentStatus.CONFIRMADO]: 'confirm',
  [AppointmentStatus.CONCLUIDO]: 'success',
  [AppointmentStatus.RECUSADO]: 'danger',
};
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>;
}

const TIER_CLASS: Record<LoyaltyTier, BadgeVariant> = {
  [LoyaltyTier.OURO]: 'ouro',
  [LoyaltyTier.PRATA]: 'prata',
  [LoyaltyTier.BRONZE]: 'bronze',
};
export function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();
  return <Badge variant={TIER_CLASS[tier]}>{label}</Badge>;
}

const FORMA_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.PIX]: 'Pix',
  [PaymentMethod.CARTAO]: 'Cartão',
  [PaymentMethod.DINHEIRO]: 'Dinheiro',
};
export function PaidBadge({ forma }: { forma: PaymentMethod }) {
  return <Badge variant="success">Pago · {FORMA_LABEL[forma]}</Badge>;
}

/** KPI — azulejo com filete de esmalte verde e número em Space Mono. */
export function KpiCard({
  label,
  value,
  valueClassName,
  carregando,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  carregando?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden px-5 py-[18px] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-verd before:to-verd-2 before:content-['']">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.06em] text-slate">{label}</p>
      {carregando ? (
        <Skeleton className="h-[39px] w-24" />
      ) : (
        <div className={cn('font-mono text-[26px] font-bold tabular-nums tracking-[-0.02em] text-ink', valueClassName)}>
          {value}
        </div>
      )}
    </Card>
  );
}
