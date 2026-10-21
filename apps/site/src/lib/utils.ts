import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge ciente das escalas customizadas da Azulejaria (raio/sombra),
// para que `rounded-pill` vença `rounded-card` etc. ao mesclar classes.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ['ticket', 'input', 'card', 'pill'] }],
      shadow: [{ shadow: ['hairline', 'raised', 'float'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
