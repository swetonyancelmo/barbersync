/** Ícones inline (espelho do set curado dos apps — traço 1.5px, grade 24px). */
type P = { size?: number; className?: string };

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

export const IconScissors = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="7" r="2.2" />
    <circle cx="6" cy="17" r="2.2" />
    <path d="M8 8.5L20 18M8 15.5L20 6M12 12l2 1.6" />
  </svg>
);

export const IconCalendar = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M4 9h16M8 3v4M16 3v4" />
  </svg>
);

export const IconBell = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const IconUsers = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M16 6a3 3 0 0 1 0 6M18 19c0-2-1-3.6-2.5-4.4" />
  </svg>
);

export const IconMoney = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.4" />
    <path d="M6 9v6M18 9v6" />
  </svg>
);

export const IconChart = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20h16" />
    <path d="M7 20v-6M12 20V9M17 20v-9" />
  </svg>
);

export const IconStar = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 4l2.3 4.9 5.2.7-3.8 3.6 1 5.2-4.7-2.6-4.7 2.6 1-5.2L4.5 9.6l5.2-.7z" />
  </svg>
);

export const IconPhone = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="7" y="3" width="10" height="18" rx="2.4" />
    <path d="M11 18h2" />
  </svg>
);

export const IconCheck = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const IconArrow = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconSun = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />
  </svg>
);
