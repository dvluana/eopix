export function CadastralIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Document outline */}
      <rect x="16" y="8" width="48" height="64" rx="4" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Lines that draw in via stroke-dashoffset */}
      <line x1="26" y1="28" x2="54" y2="28" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="28">
        <animate attributeName="stroke-dashoffset" values="28;0;0;28" keyTimes="0;0.3;0.7;1" dur="3s" repeatCount="indefinite" begin="0s" />
      </line>
      <line x1="26" y1="38" x2="50" y2="38" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="24" strokeDashoffset="24">
        <animate attributeName="stroke-dashoffset" values="24;0;0;24" keyTimes="0;0.3;0.7;1" dur="3s" repeatCount="indefinite" begin="0.3s" />
      </line>
      <line x1="26" y1="48" x2="46" y2="48" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="20" strokeDashoffset="20">
        <animate attributeName="stroke-dashoffset" values="20;0;0;20" keyTimes="0;0.3;0.7;1" dur="3s" repeatCount="indefinite" begin="0.6s" />
      </line>
      <line x1="26" y1="58" x2="42" y2="58" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="16" strokeDashoffset="16">
        <animate attributeName="stroke-dashoffset" values="16;0;0;16" keyTimes="0;0.3;0.7;1" dur="3s" repeatCount="indefinite" begin="0.9s" />
      </line>
      {/* Yellow badge in top-right corner */}
      <circle cx="58" cy="14" r="8" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1" />
      <polyline points="54,14 57,17 63,11" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProcessosIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Base block */}
      <rect x="22" y="58" width="36" height="10" rx="2" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Gavel group with strike animation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 40 48;-15 40 48;0 40 48"
          dur="2s"
          repeatCount="indefinite"
        />
        {/* Gavel handle */}
        <rect x="38" y="18" width="4" height="32" rx="1" fill="#1A1A1A" />
        {/* Gavel head */}
        <rect x="28" y="10" width="24" height="12" rx="3" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      </g>
      {/* Strike flash — yellow accent */}
      <circle cx="40" cy="58" r="4" fill="#FFD600" opacity="0">
        <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.4s" />
        <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" begin="0.4s" />
      </circle>
    </svg>
  );
}

export function ReclameIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Card outline */}
      <rect x="12" y="12" width="56" height="56" rx="4" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Stars that fade in sequentially */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`star-${i}`}>
          <polygon
            points={`${22 + i * 12},30 ${24 + i * 12},24 ${26 + i * 12},30 ${32 + i * 12},30 ${27 + i * 12},34 ${29 + i * 12},40 ${24 + i * 12},36 ${19 + i * 12},40 ${21 + i * 12},34 ${16 + i * 12},30`}
            fill="#FFD600"
            stroke="#1A1A1A"
            strokeWidth="0.8"
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              keyTimes="0;0.2;0.7;1"
              dur="4s"
              repeatCount="indefinite"
              begin={`${i * 0.4}s`}
            />
          </polygon>
        </g>
      ))}
      {/* Text lines below stars */}
      <line x1="20" y1="50" x2="60" y2="50" stroke="#D5D4D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="56" x2="50" y2="56" stroke="#D5D4D0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NoticiasIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="newsReveal">
          <rect x="12" y="32" width="0" height="40">
            <animate attributeName="width" values="0;56;56;0" keyTimes="0;0.3;0.7;1" dur="4s" repeatCount="indefinite" />
          </rect>
        </clipPath>
      </defs>
      {/* Newspaper body */}
      <rect x="12" y="12" width="56" height="56" rx="4" fill="#E8E7E3" stroke="#1A1A1A" strokeWidth="1.5" />
      {/* Header bar with yellow accent */}
      <rect x="12" y="12" width="56" height="16" rx="4" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1.5" />
      <rect x="12" y="24" width="56" height="4" fill="#FFD600" stroke="#1A1A1A" strokeWidth="0" />
      {/* Header text placeholder */}
      <line x1="22" y1="20" x2="58" y2="20" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" />
      {/* Text lines that reveal from left */}
      <g clipPath="url(#newsReveal)">
        <line x1="20" y1="38" x2="60" y2="38" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="46" x2="54" y2="46" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="54" x2="48" y2="54" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="62" x2="56" y2="62" stroke="#D5D4D0" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function ResumoIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Simplified brain outline */}
      <path
        d="M40,14 C28,14 20,22 20,32 C20,38 23,43 28,46 C26,50 26,55 28,60 C30,65 36,68 40,68 C44,68 50,65 52,60 C54,55 54,50 52,46 C57,43 60,38 60,32 C60,22 52,14 40,14 Z"
        fill="#E8E7E3"
        stroke="#1A1A1A"
        strokeWidth="1.5"
      />
      {/* Brain division line */}
      <path d="M40,18 L40,64" fill="none" stroke="#D5D4D0" strokeWidth="1" />
      {/* Circuit dots connected by lines */}
      <line x1="30" y1="30" x2="40" y2="40" stroke="#1A1A1A" strokeWidth="1" />
      <line x1="40" y1="40" x2="50" y2="32" stroke="#1A1A1A" strokeWidth="1" />
      <line x1="40" y1="40" x2="35" y2="52" stroke="#1A1A1A" strokeWidth="1" />
      <line x1="40" y1="40" x2="48" y2="50" stroke="#1A1A1A" strokeWidth="1" />
      <circle cx="30" cy="30" r="3" fill="#D5D4D0" stroke="#1A1A1A" strokeWidth="1" />
      <circle cx="50" cy="32" r="3" fill="#D5D4D0" stroke="#1A1A1A" strokeWidth="1" />
      <circle cx="35" cy="52" r="3" fill="#D5D4D0" stroke="#1A1A1A" strokeWidth="1" />
      <circle cx="48" cy="50" r="3" fill="#D5D4D0" stroke="#1A1A1A" strokeWidth="1" />
      {/* Center dot that pulses — yellow accent */}
      <circle cx="40" cy="40" r="4" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1">
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function ClimaIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Rays group that rotates slowly */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 40 40"
          to="360 40 40"
          dur="12s"
          repeatCount="indefinite"
        />
        {/* 8 rays */}
        <line x1="40" y1="8" x2="40" y2="18" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="62" x2="40" y2="72" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="40" x2="18" y2="40" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="62" y1="40" x2="72" y2="40" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="17.4" y1="17.4" x2="24.4" y2="24.4" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="55.6" y1="55.6" x2="62.6" y2="62.6" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="62.6" y1="17.4" x2="55.6" y2="24.4" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
        <line x1="24.4" y1="55.6" x2="17.4" y2="62.6" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Center circle — yellow fill */}
      <circle cx="40" cy="40" r="14" fill="#FFD600" stroke="#1A1A1A" strokeWidth="1.5">
        <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
