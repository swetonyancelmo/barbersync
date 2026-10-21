import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill font-body text-[15px] font-bold tracking-[0.2px] transition-[transform,filter,background-color,color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([width])]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // CTA principal — vermelho de poste (esmalte)
        default:
          'bg-gradient-to-b from-pole-bright to-pole-2 text-on-pole shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_-10px_rgba(163,46,34,0.7)] hover:brightness-105 active:translate-y-px',
        secondary: 'border border-line bg-tile text-ink hover:bg-tile-2',
        // contorno verde (antigo .btn-outline)
        outline:
          'border-[1.5px] border-verd bg-transparent text-verd hover:border-pine hover:bg-pine hover:text-on-enamel',
        ghost: 'text-slate hover:bg-tile-2 hover:text-ink',
        // destrutivo sólido
        destructive: 'bg-danger text-on-pole hover:brightness-105 active:translate-y-px',
        // destrutivo em contorno (antigo .btn-danger)
        danger:
          'border-[1.5px] border-danger/50 bg-transparent text-danger hover:bg-danger/10',
        success: 'bg-ok text-[#f3f7ef] hover:brightness-105',
        // chrome verde-esmalte
        enamel:
          'bg-pine text-on-enamel shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:bg-pine-2',
        link: 'rounded-none text-pole underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-14 px-8',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
