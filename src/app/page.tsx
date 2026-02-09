"use client"

import React from 'react';
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';
import { maskDocument, cleanDocument } from '@/lib/validators';

export default function LandingPage() {
  const router = useRouter();
  const [depoExpanded, setDepoExpanded] = React.useState(false);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [placeholderText, setPlaceholderText] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [documentType, setDocumentType] = React.useState<'cpf' | 'cnpj' | 'unknown'>('unknown');
  const [hasError, setHasError] = React.useState(false);

  const fullPlaceholder = 'Digite o CPF ou CNPJ';

  // Typewriter effect
  React.useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const type = () => {
      if (!isDeleting) {
        currentIndex++;
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));

        if (currentIndex >= fullPlaceholder.length) {
          isDeleting = true;
          timeout = setTimeout(type, 2000); // Pause before deleting
          return;
        }
      } else {
        currentIndex--;
        setPlaceholderText(fullPlaceholder.substring(0, currentIndex));

        if (currentIndex === 0) {
          isDeleting = false;
          timeout = setTimeout(type, 500); // Pause before next text
          return;
        }
      }

      timeout = setTimeout(type, isDeleting ? 30 : 80);
    };

    timeout = setTimeout(type, 500);

    return () => clearTimeout(timeout);
  }, []);

  const detectTypeFromLength = (value: string): 'cpf' | 'cnpj' | 'unknown' => {
    const digits = value.replace(/\D/g, '').length;
    if (digits === 11) return 'cpf';
    if (digits === 14) return 'cnpj';
    return 'unknown';
  };

  const getButtonText = () => {
    if (isValidating) return 'Validando...';
    if (documentType === 'cpf') return 'Verificar CPF';
    if (documentType === 'cnpj') return 'Verificar CNPJ';
    return 'Consultar';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskDocument(e.target.value);
    setSearchTerm(masked);
    setDocumentType(detectTypeFromLength(masked));
    setSearchError('');
    setHasError(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToHero = () => {
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      setSearchError('Digite um CPF ou CNPJ para consultar');
      setHasError(true);
      return;
    }

    setSearchError('');
    setHasError(false);
    setIsValidating(true);

    try {
      const response = await fetch('/api/search/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: cleanDocument(searchTerm),
        }),
      });

      const data = await response.json();

      if (response.status === 403 && data.blocked) {
        setSearchError('Dados indisponíveis para este documento');
        return;
      }

      if (!response.ok) {
        setSearchError(data.error || 'Documento inválido');
        return;
      }

      // Sucesso: redireciona para a página de consulta com o termo limpo
      router.push(`/consulta/${data.term}`);
    } catch {
      setSearchError('Erro ao validar documento. Tente novamente.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div>
      {/* ============================================ */}
      {/* NAV */}
      {/* ============================================ */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>

          {/* Hamburger button */}
          <button
            className="nav__hamburger"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
            <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
            <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
          </button>

          <ul className={`nav__links ${mobileMenuOpen ? 'nav__links--open' : ''}`} role="navigation">
            <li><a href="#como-funciona" className="nav__link" onClick={closeMobileMenu}>Como funciona</a></li>
            <li><a href="#consulta" className="nav__link" onClick={closeMobileMenu}>O que consulta</a></li>
            <li><a href="#precos" className="nav__link" onClick={closeMobileMenu}>Preços</a></li>
            <li><a href="#faq" className="nav__link" onClick={closeMobileMenu}>FAQ</a></li>
            <li>
              <Link
                href="/minhas-consultas"
                className="nav__link"
                style={{
                  border: '1px solid #888888',
                  padding: '8px 16px',
                  borderRadius: '6px',
                }}
                onClick={closeMobileMenu}
              >
                Entrar
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* ============================================ */}
      {/* 1. HERO */}
      {/* ============================================ */}
      <main>
        <section className="hero hero--landing" id="hero" aria-label="Consulta comercial de empresas e pessoas">
          {/* Collage background elements */}
          <div className="hero-collage">
            {/* Contract doc */}
            <svg className="float hero-collage__contract" width="140" height="160" viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
              <rect width="140" height="160" rx="4" fill="white" stroke="#D5D4D0" strokeWidth="1"/>
              <rect width="140" height="24" rx="4" fill="#E8E7E3"/>
              <rect y="20" width="140" height="4" fill="#E8E7E3"/>
              <line x1="12" y1="40" x2="128" y2="40" stroke="#E8E7E3" strokeWidth="1.5"/>
              <line x1="12" y1="52" x2="110" y2="52" stroke="#E8E7E3" strokeWidth="1.5"/>
              <line x1="12" y1="64" x2="120" y2="64" stroke="#E8E7E3" strokeWidth="1.5"/>
              <rect x="12" y="80" width="40" height="6" rx="2" fill="#FFD600" opacity=".4"/>
              <line x1="12" y1="100" x2="60" y2="100" stroke="#1A1A1A" strokeWidth=".8"/>
              <text x="12" y="116" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fill="#BBB">assinatura</text>
            </svg>
            {/* WhatsApp bubble */}
            <svg className="float hero-collage__whatsapp" width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
              <rect width="180" height="60" rx="12" fill="#DCF8C6" stroke="#D5D4D0" strokeWidth=".5"/>
              <text x="14" y="24" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#1A1A1A">Tranquilo, pago na</text>
              <text x="14" y="40" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#1A1A1A">sexta sem falta 👍</text>
              <text x="166" y="52" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fill="#888" textAnchor="end">14:32 ✓✓</text>
            </svg>
            {/* Post-it */}
            <svg className="float hero-collage__postit" width="80" height="70" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
              <rect width="80" height="70" rx="2" fill="#FFD600"/>
              <text x="40" y="28" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fontWeight="700" fill="#1A1A1A" textAnchor="middle">CHECAR</text>
              <text x="40" y="42" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fontWeight="700" fill="#1A1A1A" textAnchor="middle">CNPJ</text>
              <text x="40" y="58" fontSize="14" textAnchor="middle">⚠️</text>
            </svg>
            {/* Reclame Aqui snippet */}
            <svg className="float hero-collage__reclame" width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
              <rect width="140" height="80" rx="4" fill="white" stroke="#D5D4D0" strokeWidth=".8"/>
              <text x="10" y="18" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fill="#BBB">reclameaqui.com.br</text>
              <text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333">2.1</text>
              <text x="44" y="42" fontFamily="'IBM Plex Mono',monospace" fontSize="8" fill="#888">/10</text>
              <rect x="10" y="54" width="70" height="12" rx="3" fill="#CC3333" opacity=".15"/>
              <text x="45" y="63" fontFamily="'IBM Plex Mono',monospace" fontSize="6" fontWeight="600" fill="#CC3333" textAnchor="middle">Não Recomendada</text>
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

            <div className={`search-bar ${hasError ? 'search-bar--error' : ''}`} role="search">
              <div className="search-bar__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="10" cy="10" r="7"/>
                  <line x1="15.5" y1="15.5" x2="21" y2="21"/>
                </svg>
              </div>
              <input
                className="search-bar__input"
                type="text"
                placeholder={placeholderText}
                aria-label="Consultar CNPJ ou nome da empresa"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                className="search-bar__button"
                type="submit"
                onClick={handleSearch}
                disabled={isValidating}
              >
                {getButtonText()}
              </button>
            </div>

            {/* Erro de busca */}
            {searchError && (
              <p className="caption text-danger mt-3" style={{ textAlign: 'center' }}>
                {searchError}
              </p>
            )}

            <p className="caption text-inverse-subtle mt-4 italic">
              O que o Google não te mostra, a gente cruza, resume e entrega.
            </p>
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. FAIXA DE IMPACTO */}
        {/* ============================================ */}
        <aside className="impact" aria-label="Dados de impacto">
          <div className="impact__inner">
            <div className="impact__item">
              <div className="impact__num">8,9M</div>
              <p className="impact__text">de empresas inadimplentes no Brasil. A sua próxima parceria é uma delas?</p>
            </div>
            <div className="impact__item">
              <div className="impact__num">R$ 29,90</div>
              <p className="impact__text">custa uma consulta. Um processo custa quanto mesmo?</p>
            </div>
            <div className="impact__item">
              <div className="impact__num">3 min</div>
              <p className="impact__text">pra consultar. 3 anos pra se arrepender.</p>
            </div>
          </div>
        </aside>

        {/* ============================================ */}
        {/* 3. PRA QUEM É */}
        {/* ============================================ */}
        <section className="section section--primary" id="pra-quem">
          <div className="section-inner">
            <div className="section-header">
              <div className="section-header__tag section-header__tag--muted">PRA QUEM É</div>
              <h2 className="section-header__title">
                Quem mais toma calote é quem menos tem <span className="section-header__highlight">defesa</span>.
              </h2>
            </div>

            <div className="grid-2">
              {/* Grandes Empresas */}
              <div className="card card--accent-top">
                <h3 className="card__title">Grandes Empresas</h3>
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex align-center gap-3 caption">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                      <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Serasa Experian
                  </div>
                  <div className="flex align-center gap-3 caption">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                      <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Equipes de Compliance
                  </div>
                  <div className="flex align-center gap-3 caption">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                      <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Software de R$ 500/mês
                  </div>
                </div>
              </div>

              {/* MEI / Freelancer */}
              <div className="card card--danger-top">
                <h3 className="card__title">MEI / Freelancer</h3>
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex align-center gap-3 caption text-danger">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFF0F0" stroke="#CC3333" strokeWidth="1.5"/>
                      <line x1="6" y1="6" x2="14" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="14" y1="6" x2="6" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    &quot;Confia&quot;
                  </div>
                  <div className="flex align-center gap-3 caption text-danger">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFF0F0" stroke="#CC3333" strokeWidth="1.5"/>
                      <line x1="6" y1="6" x2="14" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="14" y1="6" x2="6" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Esperança
                  </div>
                  <div className="flex align-center gap-3 caption text-danger">
                    <svg viewBox="0 0 20 20" width="20" height="20">
                      <circle cx="10" cy="10" r="8" fill="#FFF0F0" stroke="#CC3333" strokeWidth="1.5"/>
                      <line x1="6" y1="6" x2="14" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="14" y1="6" x2="6" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Zero Ferramentas
                  </div>
                </div>
                <p className="caption" style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: 'var(--primitive-space-4)', paddingTop: 'var(--primitive-space-4)', borderTop: 'var(--primitive-border-thin) solid var(--color-border-subtle)' }}>
                  Agora tem. Uma IA que pesquisa por você em 5 bases públicas por R$ 29,90.
                </p>
              </div>
            </div>

            <div className="callout callout--info" style={{ maxWidth: '840px', margin: 'var(--primitive-space-6) auto 0' }}>
              <p className="callout__body">
                &quot;Para comprar carro usado, existe histórico veicular. Para fechar contrato de serviço, só existe a sorte.&quot;
              </p>
            </div>

            <div className="cta-container">
              <button className="btn btn--primary btn--lg" onClick={scrollToHero}>
                Consultar agora
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. COMO FUNCIONA */}
        {/* ============================================ */}
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
                    <defs><filter id="si1" x="-6%" y="-6%" width="115%" height="115%"><feDropShadow dx="1" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity=".08"/></filter></defs>
                    <g filter="url(#si1)">
                      <rect x="8" y="25" width="184" height="50" rx="8" fill="white" stroke="#1A1A1A" strokeWidth="2.5"/>
                      <circle cx="30" cy="50" r="8" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                      <line x1="36" y1="56" x2="40" y2="60" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
                      <text x="52" y="54" fontFamily="'IBM Plex Mono',monospace" fontSize="9" fill="#BBB">CNPJ ou Nome</text>
                      <rect x="158" y="33" width="26" height="34" rx="5" fill="#FFD600"/>
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
                    <circle cx="80" cy="50" r="36" fill="none" stroke="#E8E7E3" strokeWidth="2"/>
                    <circle cx="80" cy="50" r="24" fill="none" stroke="#E8E7E3" strokeWidth="1.5"/>
                    <circle cx="80" cy="50" r="12" fill="none" stroke="#E8E7E3" strokeWidth="1"/>
                    <circle cx="80" cy="50" r="4" fill="#FFD600"/>
                    <line x1="80" y1="50" x2="108" y2="30" stroke="#FFD600" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
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
                      <rect x="96" y="36" width="30" height="12" rx="3" fill="#FFD600"/>
                      <text x="111" y="45" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fontWeight="700" fill="#1A1A1A" textAnchor="middle">SOL</text>
                      <rect x="24" y="62" width="112" height="26" rx="2" fill="#1A1A1A"/>
                      <text x="80" y="77" fontFamily="'IBM Plex Mono',monospace" fontSize="5" fill="#888" textAnchor="middle">Resumo gerado por IA</text>
                      <circle cx="130" cy="82" r="2" fill="#FFD600"/>
                    </g>
                  </svg>
                </div>
                <div className="step__num">Passo 3</div>
                <div className="step__title">Você recebe o relatório completo</div>
                <p className="step__desc">Tudo numa tela: dados cadastrais, processos, reclamações, notícias, cruzados pelo nosso motor de consulta e resumidos com inteligência artificial.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--primitive-space-10)' }}>
              <button className="btn btn--primary btn--lg" onClick={scrollToHero}>
                Fazer minha primeira consulta
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. O QUE CONSULTA */}
        {/* ============================================ */}
        <section className="consulta-section" id="consulta">
          <div className="section-inner">
            <div className="section-header__tag section-header__tag--accent">O QUE A GENTE CONSULTA</div>
            <h2 className="section-header__title section-header__title--inverse mb-8" style={{ maxWidth: 'none' }}>
              Tudo que já era público e você não <span className="section-header__highlight">pesquisou</span>.
            </h2>

            <div className="consulta-timeline">
              <div className="consulta-step">
                <div className="consulta-node">01</div>
                <div className="consulta-card">
                  <h3>Dados cadastrais do CNPJ</h3>
                  <p>Situação, data de abertura, sócios, CNAE. Direto da Receita Federal.</p>
                </div>
              </div>
              <div className="consulta-step">
                <div className="consulta-node">02</div>
                <div className="consulta-card">
                  <h3>Processos cíveis</h3>
                  <p>Existem? Quantos? De que tipo? A gente mostra, você interpreta.</p>
                </div>
              </div>
              <div className="consulta-step">
                <div className="consulta-node">03</div>
                <div className="consulta-card">
                  <h3>Plataformas de reclamação</h3>
                  <p>Link direto pro Reclame Aqui. A reputação tá lá, a gente só encurta o caminho.</p>
                </div>
              </div>
              <div className="consulta-step">
                <div className="consulta-node">04</div>
                <div className="consulta-card">
                  <h3>Notícias e menções públicas</h3>
                  <p>Se saiu no jornal, a gente encontra. Se saiu no YouTube, também.</p>
                </div>
              </div>
              <div className="consulta-step">
                <div className="consulta-node">05</div>
                <div className="consulta-card">
                  <h3>Busca por nome</h3>
                  <p>Encontrou mais de uma pessoa? A gente agrupa por contexto pra você identificar quem é quem.</p>
                </div>
              </div>
            </div>

            <div className="callout callout--info" style={{ maxWidth: '840px', margin: 'var(--primitive-space-10) auto 0' }}>
              <p className="callout__body text-inverse">
                &quot;A gente não acusa, não conclui, não dá nota, não cria score moral e definitivamente não chama ninguém de pilantra. Isso fica por sua conta.&quot;
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--primitive-space-10)' }}>
              <button className="btn btn--primary btn--lg" onClick={scrollToHero}>
                Fazer minha primeira consulta
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. PREVIEW DO RESULTADO */}
        {/* ============================================ */}
        <section className="preview-section section" id="preview" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="section-inner">
            <div className="section-header" style={{ textAlign: 'center' }}>
              <div className="section-header__tag section-header__tag--muted">O QUE VOCÊ RECEBE</div>
              <h2 className="section-header__title" style={{ margin: '0 auto' }}>
                Um relatório completo em <span className="section-header__highlight">3 minutos</span>.
              </h2>
              <p className="body text-muted" style={{ maxWidth: '680px', margin: '24px auto 0' }}>
                Tudo numa única tela. Sem juridiquês, sem planilha, sem precisar abrir 15 abas no navegador.
              </p>
            </div>

            {/* Lista direta do que vem no relatório */}
            <div className="grid-3" style={{ marginBottom: 'var(--primitive-space-10)' }}>
              {/* Item 1 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                    <line x1="7" y1="9" x2="17" y2="9" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="12" x2="13" y2="12" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="15" x2="15" y2="15" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Dados cadastrais oficiais</h3>
                <p className="caption text-muted">CNPJ, razão social, situação, data de abertura, endereço e quadro societário. Direto da Receita Federal.</p>
              </div>

              {/* Item 2 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7,10 L10,4 L14,4 L17,10 L15,18 L9,18 Z" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinejoin="round"/>
                    <line x1="12" y1="9" x2="12" y2="13" stroke="#CC3333" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="15" r="1" fill="#CC3333"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Processos judiciais</h3>
                <p className="caption text-muted">Quantidade e tipo de processos cíveis encontrados nos tribunais. Você interpreta, a gente só mostra.</p>
              </div>

              {/* Item 3 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="8" width="14" height="12" rx="2" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                    <path d="M8,8 L8,6 C8,4 9.5,3 12,3 C14.5,3 16,4 16,6 L16,8" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                    <circle cx="12" cy="14" r="1.5" fill="#1A1A1A"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Reclame Aqui</h3>
                <p className="caption text-muted">Link direto para o perfil no Reclame Aqui. Se tiver reclamação, você vê quantas e do quê.</p>
              </div>

              {/* Item 4 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                    <line x1="7" y1="10" x2="17" y2="10" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="13" x2="14" y2="13" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="16" x2="11" y2="16" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Notícias e menções públicas</h3>
                <p className="caption text-muted">Matérias, artigos e menções em portais de notícias. Com data, título e link pra fonte.</p>
              </div>

              {/* Item 5 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#FFD600" strokeWidth="2"/>
                    <line x1="7" y1="10" x2="17" y2="10" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="13" x2="13" y2="13" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="7" y1="16" x2="15" y2="16" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="17" cy="17" r="3" fill="#FFD600"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Resumo inteligente</h3>
                <p className="caption text-muted">Nosso sistema cruza 5 bases públicas, filtra homônimos por região e resume tudo em um parágrafo. 47 processos, 12 reclamações, 3 matérias, você entende em 30 segundos, não em 3 horas.</p>
              </div>

              {/* Item 6 */}
              <div className="card card--accent-top">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-accent)',
                  border: '2px solid var(--color-border-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--primitive-space-5)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
                    <line x1="12" y1="2" x2="12" y2="5" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="2" y1="12" x2="5" y2="12" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="19" y1="12" x2="22" y2="12" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="19.07" y1="4.93" x2="16.95" y2="7.05" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="7.05" y1="16.95" x2="4.93" y2="19.07" stroke="#FFD600" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="body font-bold mb-3">Indicador de clima</h3>
                <p className="caption text-muted">☀️ Céu limpo (nenhuma ocorrência) ou 🌧️ Clima instável (ocorrências encontradas). Uma leitura visual instantânea.</p>
              </div>
            </div>

            {/* Destaque final */}
            <div className="callout callout--info" style={{ maxWidth: '840px', margin: 'var(--primitive-space-10) auto 0' }}>
              <p className="callout__body">
                &quot;A gente não acusa, não conclui, não dá nota, não cria score moral e definitivamente não chama ninguém de pilantra. Isso fica por sua conta.&quot;
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: 'var(--primitive-space-10)' }}>
              <button className="btn btn--primary btn--lg" onClick={scrollToHero}>
                Fazer minha primeira consulta
              </button>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 7. DEPOIMENTOS */}
        {/* ============================================ */}
        <section className="section section--secondary section--relative" id="depoimentos">
          <div className="section-inner">
            <div className="section-header">
              <div className="section-header__tag section-header__tag--muted">DEPOIMENTOS</div>
              <h2 className="section-header__title">
                Gente que pesquisou. E gente que deveria ter <span className="section-header__highlight">pesquisado</span>.
              </h2>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="grid-2" style={{ maxHeight: depoExpanded ? '2000px' : '340px', overflow: 'hidden', transition: 'max-height 0.6s ease' }}>
                <div className="card card--accent-top">
                  <span className="depo-emoji">💀</span>
                  <p className="body-sm mb-12px">&quot;Pesquisei depois do calote. Tava tudo lá. TUDO.&quot;</p>
                  <p className="caption text-muted">— Designer freelancer, SP</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">🎤</span>
                  <p className="body-sm mb-12px">&quot;Ele mandou áudio de 7 minutos explicando por que ia atrasar o pagamento. Eu devia ter consultado antes.&quot;</p>
                  <p className="caption text-muted">— Dev backend, RJ</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">🤡</span>
                  <p className="body-sm mb-12px">&quot;A empresa tinha 47 processos. QUARENTA E SETE. E eu aceitei cheque.&quot;</p>
                  <p className="caption text-muted">— Dono de agência, MG</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">🙏</span>
                  <p className="body-sm mb-12px">&quot;O cara me disse &apos;confia&apos;. Agora eu confio no E o Pix.&quot;</p>
                  <p className="caption text-muted">— Social media, PR</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">😴</span>
                  <p className="body-sm mb-12px">&quot;Minha mãe falou: pesquisa antes. Eu não ouvi. Agora pago R$ 29,90 por consulta e durmo em paz.&quot;</p>
                  <p className="caption text-muted">— Arquiteta, SC</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">📅</span>
                  <p className="body-sm mb-12px">&quot;Ele disse que pagava na sexta. Estamos em março. A sexta era de novembro.&quot;</p>
                  <p className="caption text-muted">— Fotógrafo, CE</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">📰</span>
                  <p className="body-sm mb-12px">&quot;Fui a consulta e apareceu até matéria no jornal. O Google que eu deveria ter feito.&quot;</p>
                  <p className="caption text-muted">— Consultora de RH, DF</p>
                </div>
                <div className="card card--accent-top">
                  <span className="depo-emoji">⚖️</span>
                  <p className="body-sm mb-12px">&quot;Descobri que meu fornecedor tinha mais processo que cliente. Obrigada, E o Pix.&quot;</p>
                  <p className="caption text-muted">— Dona de e-commerce, BA</p>
                </div>
              </div>
              {!depoExpanded && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '240px',
                  background: 'linear-gradient(to top, #F0EFEB 0%, #F0EFEB 10%, rgba(240,239,235,0.95) 30%, rgba(240,239,235,0.8) 50%, rgba(240,239,235,0.4) 75%, rgba(240,239,235,0) 100%)',
                  pointerEvents: 'none',
                  transition: 'opacity 0.4s'
                }} />
              )}
              <div style={{ textAlign: 'center', marginTop: '24px', position: 'relative', zIndex: 2 }}>
                <button
                  className="btn btn--ghost"
                  onClick={() => setDepoExpanded(!depoExpanded)}
                >
                  {depoExpanded ? 'Ver menos' : 'Ler mais depoimentos'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 8. PREÇOS */}
        {/* ============================================ */}
        <section className="section section--primary" id="precos">
          <div className="section-inner">
            <div className="section-header">
              <div className="section-header__tag section-header__tag--muted">PREÇOS</div>
              <h2 className="section-header__title">
                Mais barato que a sessão de terapia depois do <span className="section-header__highlight">calote</span>.
              </h2>
            </div>

            <div className="grid-3">
              <div className="pricing-card">
                <div className="pricing-card__label">Pacote 5 consultas</div>
                <p className="pricing-card__audience">Para freelancers e pequenos escritórios</p>
                <div className="pricing-card__value">
                  R$ 119<span className="pricing-card__value-small">,90</span>
                </div>
                <p className="pricing-card__desc">&quot;Pra quem trabalha com vários clientes e já aprendeu que gente boa também dá calote.&quot;</p>
                <p className="pricing-card__includes">5 relatórios · R$ 23,98 por consulta</p>
                <button className="pricing-card__cta" disabled>Em breve</button>
              </div>

              <div className="pricing-card pricing-card--featured">
                <div className="pricing-card__label">Consulta avulsa</div>
                <p className="pricing-card__audience">Para autônomos e freelancers</p>
                <div className="pricing-card__value">
                  R$ 29<span className="pricing-card__value-small">,90</span>
                </div>
                <p className="pricing-card__desc">&quot;Pra aquele contrato que você tá quase fechando com um pressentimento estranho.&quot;</p>
                <p className="pricing-card__includes px-[0px] py-[16px]">Relatório completo · Fontes linkadas · Válido por 7 dias</p>
                <button className="btn btn--primary btn--lg" onClick={scrollToHero} style={{ width: '100%' }}>Comprar agora</button>
              </div>

              <div className="pricing-card">
                <div className="pricing-card__label">Pacote 15 consultas</div>
                <p className="pricing-card__audience">Para agências, escritórios e estúdios</p>
                <div className="pricing-card__value">
                  R$ 299<span className="pricing-card__value-small">,90</span>
                </div>
                <p className="pricing-card__desc">&quot;Pra agência, escritório ou qualquer um que já cansou de ouvir &apos;semana que vem eu pago&apos;.&quot;</p>
                <p className="pricing-card__includes">15 relatórios · R$ 19,99 por consulta</p>
                <button className="pricing-card__cta" disabled>Em breve</button>
              </div>
            </div>
            <div className="callout callout--info mt-8" style={{ maxWidth: '840px', margin: 'var(--primitive-space-8) auto 0' }}>
              <p className="callout__body text-center" style={{ margin: 0, fontStyle: 'italic' }}>
                Sem assinatura. Sem fidelidade. Sem letras miúdas. Irônico, né?
              </p>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 9. FAQ */}
        {/* ============================================ */}
        <section className="section section--secondary" id="faq">
          <div className="section-inner">
            <div className="section-header section-header--centered-full">
              <div className="section-header__tag section-header__tag--muted">FAQ</div>
              <h2 className="section-header__title section-header__title--auto-margin">
                Perguntas que você deveria ter feito antes do <span className="section-header__highlight">contrato</span>.
              </h2>
            </div>

            <div className="faq-container">
              {[
                {
                  question: 'Vocês são detetive particular?',
                  answer: 'Não. A gente organiza informação pública que já existe na internet. O Google faz isso de graça, a gente só faz melhor e mais rápido.'
                },
                {
                  question: 'Como a IA gera o resumo?',
                  answer: 'Nossa inteligência artificial lê todos os dados encontrados e gera um resumo factual em linguagem clara. Ela não dá opinião, não acusa ninguém e não inventa dados. Só resume o que é público.'
                },
                {
                  question: 'Posso processar alguém com base no relatório?',
                  answer: 'A gente é espelho, não advogado. O relatório mostra fontes públicas. O que você faz com isso é responsabilidade sua. Pra ações legais, consulte um advogado de verdade.'
                },
                {
                  question: 'E se o relatório não encontrar nada?',
                  answer: 'Ótimo! Mas a gente não é vidente. Não encontrar nada não é a mesma coisa que garantir que tá tudo bem. Reforce o contrato mesmo assim.'
                },
                {
                  question: 'Vocês guardam os dados de quem eu pesquiso?',
                  answer: 'Não. Cada consulta é ao vivo. A gente não monta perfil permanente de ninguém. Consultou, recebeu, acabou.'
                },
                {
                  question: 'Posso pesquisar meu próprio nome?',
                  answer: 'Pode e deveria. Melhor você descobrir o que tá público do que seu próximo cliente descobrir primeiro.'
                },
                {
                  question: 'Vocês chamam alguém de pilantra?',
                  answer: 'Jamais. A gente só mostra informação pública com fonte. Se o reflexo incomodar, o problema não é o espelho.'
                }
              ].map((item, i) => (
                <div key={i} className={`faq ${openFaq === i ? 'faq--open' : ''}`}>
                  <button
                    className="faq__question"
                    onClick={() => toggleFaq(i)}
                    aria-expanded={openFaq === i}
                  >
                    {item.question}
                  </button>
                  <div className="faq__answer">
                    <p className="faq__answer-text">{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 10. CTA FINAL */}
        {/* ============================================ */}
        <section className="hero hero--landing" style={{ minHeight: '70vh' }}>
          <div className="hero-content">
            <h2 className="display-lg text-inverse mb-4">
              Contrato reforçado custa R$ 29,90.<br/>
              <em style={{ fontStyle: 'normal', color: 'var(--color-text-accent)' }}>Processo custa sua paz.</em>
            </h2>

            <div className={`search-bar ${hasError ? 'search-bar--error' : ''}`} role="search" style={{ marginTop: '40px' }}>
              <div className="search-bar__icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="10" cy="10" r="7"/>
                  <line x1="15.5" y1="15.5" x2="21" y2="21"/>
                </svg>
              </div>
              <input
                className="search-bar__input"
                type="text"
                placeholder={placeholderText}
                aria-label="Consultar CNPJ ou nome da empresa"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                className="search-bar__button"
                type="submit"
                onClick={handleSearch}
                disabled={isValidating}
              >
                {getButtonText()}
              </button>
            </div>

            {/* Erro de busca no CTA final */}
            {searchError && (
              <p className="caption text-danger mt-3" style={{ textAlign: 'center' }}>
                {searchError}
              </p>
            )}

            <p className="caption text-accent mt-5" style={{ fontStyle: 'italic' }}>
              &quot;Não é fofoca. É fonte.&quot;
            </p>
          </div>
        </section>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <Footer />
    </div>
  );
}
