"use client"

import SearchBar from './SearchBar';

interface HeroSectionProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function HeroSection({
  searchTerm,
  placeholderText,
  hasError,
  searchError,
  isValidating,
  onInputChange,
  onSearch,
  buttonText,
}: HeroSectionProps) {
  return (
    <section className="hero hero--landing" id="hero" aria-label="Consulta comercial de empresas e pessoas">
      {/* Collage background elements */}
      <div className="hero-collage">
        {/* Contract doc */}
        <svg className="float hero-collage__contract" width="140" height="160" viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
          <rect width="140" height="160" rx="4" fill="white" stroke="#D5D4D0" strokeWidth="1"/>
          <rect width="140" height="24" rx="4" fill="#E8E7E3"/>
          <rect y="20" width="140" height="4" fill="#E8E7E3"/>
          <line x1="12" y1="40" x2="128" y2="40" stroke="#E8E7E3" strokeWidth="1.5" strokeDasharray="116" strokeDashoffset="116">
            <animate attributeName="stroke-dashoffset" values="116;0" dur="1.2s" begin="0.3s" fill="freeze"/>
          </line>
          <line x1="12" y1="52" x2="110" y2="52" stroke="#E8E7E3" strokeWidth="1.5" strokeDasharray="98" strokeDashoffset="98">
            <animate attributeName="stroke-dashoffset" values="98;0" dur="1.2s" begin="0.6s" fill="freeze"/>
          </line>
          <line x1="12" y1="64" x2="120" y2="64" stroke="#E8E7E3" strokeWidth="1.5" strokeDasharray="108" strokeDashoffset="108">
            <animate attributeName="stroke-dashoffset" values="108;0" dur="1.2s" begin="0.9s" fill="freeze"/>
          </line>
          <rect x="12" y="80" width="40" height="6" rx="2" fill="#FFD600" opacity="0">
            <animate attributeName="opacity" values="0;0.4" dur="0.4s" begin="1.5s" fill="freeze"/>
          </rect>
          <line x1="12" y1="100" x2="60" y2="100" stroke="#1A1A1A" strokeWidth=".8" strokeDasharray="48" strokeDashoffset="48">
            <animate attributeName="stroke-dashoffset" values="48;0" dur="1.2s" begin="2s" fill="freeze"/>
          </line>
          <text x="12" y="116" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fill="#BBB">assinatura</text>
        </svg>
        {/* WhatsApp bubble */}
        <svg className="float hero-collage__whatsapp" width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="whatsClip">
              <rect x="0" y="0" width="0" height="60">
                <animate attributeName="width" values="0;180" dur="1.8s" begin="0.5s" fill="freeze"/>
              </rect>
            </clipPath>
          </defs>
          <rect width="180" height="60" rx="12" fill="#DCF8C6" stroke="#D5D4D0" strokeWidth=".5"/>
          <g clipPath="url(#whatsClip)">
            <text x="14" y="24" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#1A1A1A">Tranquilo, pago na</text>
            <text x="14" y="40" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#1A1A1A">sexta sem falta 👍</text>
            <text x="166" y="52" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fill="#888" textAnchor="end">14:32 ✓✓</text>
          </g>
        </svg>
        {/* Post-it */}
        <svg className="float hero-collage__postit" width="80" height="70" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;2;-2;0" dur="4s" repeatCount="indefinite"/>
            <rect width="80" height="70" rx="2" fill="#FFD600"/>
            <text x="40" y="28" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fontWeight="700" fill="#1A1A1A" textAnchor="middle">CHECAR</text>
            <text x="40" y="42" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fontWeight="700" fill="#1A1A1A" textAnchor="middle">CNPJ</text>
            <text x="40" y="58" fontSize="14" textAnchor="middle">
              ⚠️
              <animate attributeName="font-size" values="14;16;14" dur="2.5s" repeatCount="indefinite"/>
            </text>
          </g>
        </svg>
        {/* Reclame Aqui snippet */}
        <svg className="float hero-collage__reclame" width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
          <rect width="140" height="80" rx="4" fill="white" stroke="#D5D4D0" strokeWidth=".8"/>
          <text x="10" y="18" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fill="#BBB">reclameaqui.com.br</text>
          {/* Score counter animation: 0.0 → 1.2 → 2.1 */}
          <text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333">0.0
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.3;0.35" dur="2s" fill="freeze"/>
          </text>
          <text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333" opacity="0">1.2
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.3;0.35;0.6;0.65" dur="2s" fill="freeze"/>
          </text>
          <text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333" opacity="0">2.1
            <animate attributeName="opacity" values="0;0;1" keyTimes="0;0.6;0.65" dur="2s" fill="freeze"/>
          </text>
          <text x="44" y="42" fontFamily="'IBM Plex Mono',monospace" fontSize="8" fill="#888">/10</text>
          {/* "Não Recomendada" bar slide-in */}
          <g>
            <rect x="10" y="54" width="70" height="12" rx="3" fill="#CC3333" opacity=".15"/>
            <text x="45" y="63" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fontWeight="600" fill="#CC3333" textAnchor="middle">Não Recomendada</text>
            <animateTransform attributeName="transform" type="translate" values="-80,0;0,0" dur="0.5s" begin="1.5s" fill="freeze"/>
          </g>
        </svg>
      </div>

      <div className="hero-content">
        <div className="section-header__tag section-header__tag--accent">Consulta comercial sob demanda</div>
        <h1 className="display-xl text-inverse mb-4">
          Pesquise qualquer empresa ou pessoa antes de <em className="text-accent-em">fechar contrato</em>.
        </h1>
        <p className="body text-inverse-muted mb-8 max-w-narrow">
          Processos, dívidas, reclamações e notícias, tudo cruzado por IA num único relatório. Digita o CPF ou CNPJ e descobre em minutos.
        </p>

        <SearchBar
          searchTerm={searchTerm}
          placeholderText={placeholderText}
          hasError={hasError}
          searchError={searchError}
          isValidating={isValidating}
          onInputChange={onInputChange}
          onSearch={onSearch}
          buttonText={buttonText}
        />

        <p className="caption text-inverse-subtle mt-4 italic">
          O que o Google não te mostra, a gente cruza, resume e entrega.
        </p>
      </div>
    </section>
  );
}
