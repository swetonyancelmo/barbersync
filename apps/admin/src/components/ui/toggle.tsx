'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Seleção = vermelho de poste (chips de data/horário)
const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-input text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([width])]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-slate hover:bg-tile-2 hover:text-ink data-[state=on]:bg-pole data-[state=on]:text-on-pole',
        outline:
          'border border-line bg-tile text-ink hover:bg-tile-2 data-[state=on]:border-pole data-[state=on]:bg-pole/10 data-[state=on]:text-pole',
      },
      size: {
        default: 'h-10 px-3',
        sm: 'h-9 px-2.5',
        lg: 'h-12 px-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
