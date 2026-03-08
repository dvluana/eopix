export function CorporateIllustration() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
      {/* Main building */}
      <rect x="40" y="10" width="50" height="80" rx="2" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Windows grid: 3 columns x 4 rows */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`w-${row}-${col}`}
            x={48 + col * 14}
            y={18 + row * 16}
            width="8"
            height="10"
            rx="1"
            fill="white"
            stroke="#D5D4D0"
            strokeWidth="1"
          />
        ))
      )}
      {/* Entrance door — yellow accent */}
      <rect x="57" y="76" width="16" height="14" rx="2" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Small desk to the side */}
      <rect x="105" y="68" width="30" height="2" rx="1" fill="#1A1A1A" />
      <rect x="108" y="70" width="2" height="18" fill="#1A1A1A" />
      <rect x="130" y="70" width="2" height="18" fill="#1A1A1A" />
      {/* Monitor on desk */}
      <rect x="110" y="52" width="20" height="16" rx="2" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      <rect x="118" y="68" width="4" height="2" fill="#1A1A1A" />
      {/* Chart line on monitor in yellow */}
      <polyline
        points="113,63 117,58 121,61 126,55"
        fill="none"
        stroke="#FFD600"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ground line */}
      <line x1="20" y1="90" x2="140" y2="90" stroke="#D5D4D0" strokeWidth="1" />
    </svg>
  );
}

export function FreelancerIllustration() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
      {/* Laptop screen */}
      <rect x="45" y="25" width="70" height="45" rx="3" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Screen inner */}
      <rect x="50" y="30" width="60" height="35" rx="1" fill="white" stroke="#D5D4D0" strokeWidth="1" />
      {/* ??? on screen */}
      <text
        x="80"
        y="52"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="14"
        fontWeight="700"
        fill="#D5D4D0"
        textAnchor="middle"
      >
        ???
      </text>
      {/* Laptop base */}
      <path d="M40,70 L45,70 L115,70 L120,70 L125,76 L35,76 Z" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Post-it note 1 — yellow, slightly rotated */}
      <g transform="rotate(-8, 22, 35)">
        <rect x="12" y="25" width="22" height="20" rx="1" fill="#FFD600" stroke="#1A1A1A" strokeWidth="0.8" />
        <line x1="16" y1="32" x2="30" y2="32" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="16" y1="36" x2="26" y2="36" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round" />
      </g>

      {/* Post-it note 2 — yellow, rotated other way */}
      <g transform="rotate(12, 140, 30)">
        <rect x="128" y="20" width="22" height="20" rx="1" fill="#FFD600" stroke="#1A1A1A" strokeWidth="0.8" />
        <line x1="132" y1="27" x2="146" y2="27" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="132" y1="31" x2="142" y2="31" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round" />
      </g>

      {/* Post-it note 3 — small, tilted */}
      <g transform="rotate(5, 135, 65)">
        <rect x="125" y="58" width="18" height="16" rx="1" fill="#FFD600" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.8" />
        <line x1="128" y1="64" x2="140" y2="64" stroke="#1A1A1A" strokeWidth="0.6" strokeLinecap="round" />
      </g>

      {/* Coffee ring stain */}
      <circle cx="25" cy="72" r="10" fill="none" stroke="#D5D4D0" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />

      {/* Ground line */}
      <line x1="20" y1="90" x2="140" y2="90" stroke="#D5D4D0" strokeWidth="1" />
    </svg>
  );
}
