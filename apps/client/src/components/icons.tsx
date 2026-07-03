/**
 * Set curado de ícones do BarberSync — inline SVG, traço 1.5px numa grade de
 * 24px, herdam currentColor. Usados só onde ajudam (nav, status, vazios).
 */
type P = { size?: number; className?: string };

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconHome = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 11l8-6 8 6" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </svg>
);

// Tesoura de barbeiro (agendar)
export const IconScissors = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="7" r="2.2" />
    <circle cx="6" cy="17" r="2.2" />
    <path d="M8 8.5L20 18" />
    <path d="M8 15.5L20 6" />
    <path d="M12 12l2 1.6" />
  </svg>
);

export const IconUser = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
  </svg>
);

// Comanda / recibo (financeiro, ticket)
export const IconReceipt = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21z" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const IconClock = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const IconCheck = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

// Navalha (marca / detalhe)
export const IconRazor = ({ size = 22, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 8h11a3 3 0 0 1 3 3v0H6a3 3 0 0 1-3-3v0z" />
    <path d="M17 11l3-6" />
    <path d="M9 14v5a2 2 0 0 0 2 2h0" />
  </svg>
);

export const IconStar = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4l2.3 4.9 5.2.7-3.8 3.6 1 5.2-4.7-2.6-4.7 2.6 1-5.2L4.5 9.6l5.2-.7z" />
  </svg>
);
