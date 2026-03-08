interface HowItWorksSectionProps {
  onCtaClick: () => void;
}

export default function HowItWorksSection({ onCtaClick }: HowItWorksSectionProps) {
  return (
    <section className="section section--secondary" id="como-funciona">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">COMO FUNCIONA</div>
          <h2 className="section-header__title">
            Simples assim. Difícil é explicar pro contador o calote que você <span className="section-header__highlight">levou</span>.
          </h2>
        </div>

        <div className="steps-grid">
          {/* Step 1 */}
          <div className="step">
            <div className="step__icon">
              <svg viewBox="0 0 200 100" width="100%" height="100" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '200px' }}>
                <defs>
                  <filter id="si1" x="-6%" y="-6%" width="115%" height="115%"><feDropShadow dx="1" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity=".08"/></filter>
                  <clipPath id="typeClip1">
                    <rect x="52" y="38" height="20" width="0">
                      <animate attributeName="width" values="0;0;65;65;65;0" keyTimes="0;0.1;0.5;0.65;0.85;1" dur="4s" repeatCount="indefinite"/>
                    </rect>
                  </clipPath>
                </defs>
                <g filter="url(#si1)">
                  <rect x="8" y="25" width="184" height="50" rx="8" fill="white" stroke="#1A1A1A" strokeWidth="2.5"/>
                  <g>
                    <circle cx="30" cy="50" r="8" fill="none" stroke="#1A1A1A" strokeWidth="2">
                      <animate attributeName="r" values="8;8.8;8" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="36" y1="56" x2="40" y2="60" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                  <g clipPath="url(#typeClip1)">
                    <text x="52" y="54" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fill="#1A1A1A">CNPJ ou Nome</text>
                  </g>
                  <rect y="43" width="1.5" height="13" fill="#1A1A1A">
                    <animate attributeName="x" values="52;52;116;116;116;52" keyTimes="0;0.1;0.5;0.65;0.85;1" dur="4s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite"/>
                  </rect>
                  <rect x="158" y="33" width="26" height="34" rx="5" fill="#FFD600">
                    <animate attributeName="opacity" values="1;0.75;1" dur="2.5s" repeatCount="indefinite"/>
                  </rect>
                  <text x="171" y="54" fontFamily="'IBM Plex Mono',monospace" fontSize="7" fontWeight="700" fill="#1A1A1A" textAnchor="middle">IR</text>
                </g>
              </svg>
            </div>
            <div className="step__num">Passo 1</div>
            <div className="step__title">Digita o nome ou CNPJ</div>
            <p className="step__desc">Sem cadastro. Sem login. Só digitar e clicar.</p>
          </div>

          {/* Step 2 */}
          <div className="step">
            <div className="step__icon">
              <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="50" r="36" fill="none" stroke="#E8E7E3" strokeWidth="2" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" begin="0.6s"/>
                  <animate attributeName="r" values="34;38;34" dur="3s" repeatCount="indefinite" begin="0.6s"/>
                </circle>
                <circle cx="80" cy="50" r="24" fill="none" stroke="#E8E7E3" strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" begin="0.3s"/>
                  <animate attributeName="r" values="22;26;22" dur="3s" repeatCount="indefinite" begin="0.3s"/>
                </circle>
                <circle cx="80" cy="50" r="12" fill="none" stroke="#E8E7E3" strokeWidth="1" opacity="0.4">
                  <animate attributeName="opacity" values="0.2;0.7;0.2" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="80" cy="50" r="4" fill="#FFD600">
                  <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite"/>
                </circle>
                <g>
                  <line x1="80" y1="50" x2="108" y2="30" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                  <animateTransform attributeName="transform" type="rotate" from="0 80 50" to="360 80 50" dur="4s" repeatCount="indefinite"/>
                </g>
                <circle cx="95" cy="35" r="2" fill="#FFD600" opacity="0">
                  <animate attributeName="opacity" values="0;0.8;0" dur="4s" repeatCount="indefinite" begin="1s"/>
                </circle>
                <circle cx="60" cy="65" r="1.5" fill="#FFD600" opacity="0">
                  <animate attributeName="opacity" values="0;0.6;0" dur="4s" repeatCount="indefinite" begin="2.5s"/>
                </circle>
              </svg>
            </div>
            <div className="step__num">Passo 2</div>
            <div className="step__title">A gente busca nas fontes públicas</div>
            <p className="step__desc">Cruzamos várias bases de dados públicas. Receita Federal, tribunais, Reclame Aqui, notícias, tudo consultado e cruzado automaticamente. Sem você abrir uma aba sequer.</p>
          </div>

          {/* Step 3 */}
          <div className="step">
            <div className="step__icon">
              <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
                <defs><filter id="si3" x="-6%" y="-6%" width="115%" height="115%"><feDropShadow dx="1" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity=".08"/></filter></defs>
                <g filter="url(#si3)">
                  <rect x="16" y="5" width="128" height="90" rx="5" fill="white" stroke="#D5D4D0" strokeWidth="1"/>
                  <rect x="16" y="5" width="128" height="18" rx="5" fill="#E8E7E3"/>
                  <rect x="16" y="18" width="128" height="5" fill="#E8E7E3"/>
                  <rect x="24" y="32" width="48" height="24" rx="2" fill="#F0EFEB"/>
                  <rect x="78" y="32" width="56" height="24" rx="2" fill="#F0EFEB"/>
                  <rect x="96" y="36" width="30" height="12" rx="3" fill="#FFD600">
                    <animate attributeName="opacity" values="1;0.65;1" dur="2s" repeatCount="indefinite"/>
                  </rect>
                  <text x="111" y="45" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fontWeight="700" fill="#1A1A1A" textAnchor="middle">SOL</text>
                  <rect x="24" y="62" width="112" height="26" rx="2" fill="#1A1A1A"/>
                  <text x="62" y="77" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fill="#666" textAnchor="middle">Resumo por IA</text>
                  <circle cx="106" cy="75" r="1.5" fill="#888">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="112" cy="75" r="1.5" fill="#888">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
                  </circle>
                  <circle cx="118" cy="75" r="1.5" fill="#888">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" begin="0.4s"/>
                  </circle>
                  <circle cx="130" cy="82" r="2" fill="#FFD600">
                    <animate attributeName="r" values="1.5;3;1.5" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </g>
              </svg>
            </div>
            <div className="step__num">Passo 3</div>
            <div className="step__title">Você recebe o relatório completo</div>
            <p className="step__desc">Tudo numa tela: dados cadastrais, processos, reclamações, notícias, cruzados pelo nosso motor de consulta e resumidos com inteligência artificial.</p>
          </div>
        </div>

        <div className="cta-container">
          <button className="btn btn--cta btn--lg" onClick={onCtaClick}>
            Fazer minha primeira consulta
          </button>
        </div>
      </div>
    </section>
  );
}
