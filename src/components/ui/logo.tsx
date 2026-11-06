export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} role="img" aria-label="Pulso — bateria">
      <rect width="64" height="48" rx="11" fill="url(#pulso-mark)" />
      <defs>
        <linearGradient id="pulso-mark" x1="0" y1="0" x2="64" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f66f6f" />
          <stop offset="1" stopColor="#d7262f" />
        </linearGradient>
      </defs>

      <g fill="none" stroke="#f5e9ea" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 12h48M13 12v26m38-26v26M20 31l-4 12m28-12 4 12m-29 0h30" strokeWidth="1.4" opacity=".8" />
        <path d="m8 10 8 2-8 2-8-2 8-2Zm48 0 8 2-8 2-8-2 8-2Z" fill="#e4d4d4" strokeWidth="1" />
        <path d="M25 5v9m14-9v9" strokeWidth="1.2" />
        <rect x="20" y="9" width="10" height="9" rx="2" fill="#b51f29" strokeWidth="1.2" />
        <ellipse cx="25" cy="9" rx="5" ry="1.8" fill="#f5e9ea" strokeWidth="1" />
        <rect x="35" y="9" width="10" height="9" rx="2" fill="#b51f29" strokeWidth="1.2" />
        <ellipse cx="40" cy="9" rx="5" ry="1.8" fill="#f5e9ea" strokeWidth="1" />
        <path d="M11 21v10m8-11v10" strokeWidth="1.2" />
        <rect x="8" y="19" width="13" height="8" rx="3" fill="#b51f29" strokeWidth="1.2" />
        <ellipse cx="14.5" cy="19" rx="6.5" ry="2.1" fill="#f5e9ea" strokeWidth="1" />
        <path d="M48 23v13m7-13v13" strokeWidth="1.2" />
        <rect x="46" y="20" width="13" height="14" rx="3" fill="#b51f29" strokeWidth="1.2" />
        <ellipse cx="52.5" cy="20" rx="6.5" ry="2.1" fill="#f5e9ea" strokeWidth="1" />
        <path d="M21 23v11m22-11v11" strokeWidth="1.3" />
        <path d="M26 40v4l-3 2m15-6v4l3 2m-17 0h18" strokeWidth="1.5" />
        <circle cx="32" cy="31" r="11" fill="#b51f29" strokeWidth="1.5" />
        <circle cx="32" cy="31" r="8.5" fill="#f4eeee" strokeWidth="1.3" />
        <circle cx="32" cy="31" r="2" fill="#b51f29" strokeWidth="1" />
      </g>
    </svg>
  );
}
