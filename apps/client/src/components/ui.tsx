import { AppointmentStatus, LoyaltyTier } from '@barbersync/shared';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';

/** Avatar circular com iniciais do nome (sem foto — CLAUDE.md §4). */
export function BarberAvatar({ nome, size = 44 }: { nome: string; size?: number }) {
  return (
    <Avatar style={{ width: size, height: size }}>
      <AvatarFallback style={{ fontSize: size * 0.36 }}>{initials(nome)}</AvatarFallback>
    </Avatar>
  );
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDENTE]: 'Pendente',
  [AppointmentStatus.CONFIRMADO]: 'Confirmado',
  [AppointmentStatus.CONCLUIDO]: 'Concluído',
  [AppointmentStatus.RECUSADO]: 'Recusado',
};

const STATUS_VARIANT: Record<AppointmentStatus, NonNullable<BadgeProps['variant']>> = {
  [AppointmentStatus.PENDENTE]: 'pending',
  [AppointmentStatus.CONFIRMADO]: 'confirm',
  [AppointmentStatus.CONCLUIDO]: 'success',
  [AppointmentStatus.RECUSADO]: 'danger',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}

const TIER_VARIANT: Record<LoyaltyTier, NonNullable<BadgeProps['variant']>> = {
  [LoyaltyTier.OURO]: 'ouro',
  [LoyaltyTier.PRATA]: 'prata',
  [LoyaltyTier.BRONZE]: 'bronze',
};

export function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();
  return <Badge variant={TIER_VARIANT[tier]}>{label}</Badge>;
}
