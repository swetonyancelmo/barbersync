import { AppointmentStatus, LoyaltyTier, PaymentMethod } from '@barbersync/shared';
import { initials } from '@/lib/format';

export function BarberAvatar({ nome, size = 44 }: { nome: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(nome)}
    </span>
  );
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDENTE]: 'Pendente',
  [AppointmentStatus.CONFIRMADO]: 'Confirmado',
  [AppointmentStatus.CONCLUIDO]: 'Concluído',
  [AppointmentStatus.RECUSADO]: 'Recusado',
};
const STATUS_CLASS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDENTE]: 'badge-pending',
  [AppointmentStatus.CONFIRMADO]: 'badge-confirm',
  [AppointmentStatus.CONCLUIDO]: 'badge-success',
  [AppointmentStatus.RECUSADO]: 'badge-danger',
};
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}

const TIER_CLASS: Record<LoyaltyTier, string> = {
  [LoyaltyTier.OURO]: 'badge-ouro',
  [LoyaltyTier.PRATA]: 'badge-prata',
  [LoyaltyTier.BRONZE]: 'badge-bronze',
};
export function TierBadge({ tier }: { tier: LoyaltyTier }) {
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();
  return <span className={`badge ${TIER_CLASS[tier]}`}>{label}</span>;
}

const FORMA_LABEL: Record<PaymentMethod, string> = {
  [PaymentMethod.PIX]: 'Pix',
  [PaymentMethod.CARTAO]: 'Cartão',
  [PaymentMethod.DINHEIRO]: 'Dinheiro',
};
export function PaidBadge({ forma }: { forma: PaymentMethod }) {
  return <span className="badge badge-success">Pago · {FORMA_LABEL[forma]}</span>;
}
