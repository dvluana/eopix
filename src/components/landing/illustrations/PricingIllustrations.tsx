export function SolBadge() {
  return (
    <svg viewBox="0 0 60 70" width="60" height="70" xmlns="http://www.w3.org/2000/svg">
      {/* Shield pulse fill — yellow glow behind */}
      <path
        d="M30,4 L54,16 L54,38 C54,52 42,62 30,66 C18,62 6,52 6,38 L6,16 Z"
        fill="#FFD600"
        stroke="none"
        opacity="0"
      >
        <animate attributeName="opacity" values="0;0.15;0" dur="3s" repeatCount="indefinite" />
      </path>
      {/* Shield outline */}
      <path
        d="M30,4 L54,16 L54,38 C54,52 42,62 30,66 C18,62 6,52 6,38 L6,16 Z"
        fill="#E8E7E3"
        stroke="#FFD600"
        strokeWidth="2"
      />
      {/* SOL text centered */}
      <text
        x="30"
        y="40"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="14"
        fontWeight="700"
        fill="#1A1A1A"
        textAnchor="middle"
        dominantBaseline="central"
      >
        SOL
      </text>
    </svg>
  );
}

export function PackageIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      {/* Box front face */}
      <rect x="8" y="22" width="36" height="30" rx="2" fill="#E8E7E3" stroke="#D5D4D0" strokeWidth="1.5" />
      {/* Box top face (parallelogram) */}
      <path
        d="M8,22 L20,10 L56,10 L44,22 Z"
        fill="#E8E7E3"
        stroke="#D5D4D0"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Box right side */}
      <path
        d="M44,22 L56,10 L56,40 L44,52 Z"
        fill="#E8E7E3"
        stroke="#D5D4D0"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Yellow ribbon — vertical */}
      <line x1="26" y1="10" x2="26" y2="52" stroke="#FFD600" strokeWidth="2.5" />
      {/* Yellow ribbon — horizontal across front */}
      <line x1="8" y1="37" x2="44" y2="37" stroke="#FFD600" strokeWidth="2.5" />
      {/* Ribbon on top face */}
      <line x1="26" y1="22" x2="38" y2="10" stroke="#FFD600" strokeWidth="2.5" />
      {/* Ribbon on right side */}
      <line x1="44" y1="37" x2="56" y2="25" stroke="#FFD600" strokeWidth="2.5" />
      {/* Ribbon cross center dot */}
      <circle cx="26" cy="37" r="3" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1" />
    </svg>
  );
}
