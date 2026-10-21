import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-[5px] whitespace-nowrap rounded-pill px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.05em]',
  {
    variants: {
      variant: {
        default: 'bg-pine text-on-enamel',
        secondary: 'bg-tile-2 text-ink',
        outline: 'border border-line text-ink',
        // Status de agendamento / pagamento (espelham .badge-* legados)
        success: 'bg-ok/15 text-ok',
        confirm: 'border border-verd/40 bg-verd/[0.14] text-verd',
        pending: 'bg-slate/15 text-slate',
        danger: 'bg-danger/[0.14] text-danger',
        // Tiers de fidelidade
        ouro: 'bg-tier-ouro/[0.16] text-tier-ouro',
        prata: 'bg-tier-prata/[0.18] text-tier-prata',
        bronze: 'bg-tier-bronze/[0.17] text-tier-bronze',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
