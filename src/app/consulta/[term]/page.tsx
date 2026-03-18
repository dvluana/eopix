"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import TopBar from '@/components/TopBar';
import MaintenanceCallout from '@/components/MaintenanceCallout';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import RegisterModal, { type RegisterData } from '@/components/RegisterModal';
import EopixLoader from '@/components/EopixLoader';
import { formatDocument } from '@/lib/validators';

/* ── Social proof: aligned with landing tone (calote, "confia", practical) ── */
const SOCIAL_PROOF = [
  { name: 'Maria S.', city: 'SP', action: 'consultou antes de fechar contrato', time: 'há 2 min' },
  { name: 'Carlos R.', city: 'RJ', action: 'descobriu 3 processos antes do calote', time: 'há 4 min' },
  { name: 'Ana P.', city: 'BH', action: 'verificou fornecedor novo — tinha pendência', time: 'há 7 min' },
  { name: 'Pedro L.', city: 'PR', action: 'pesquisou sócio antes de assinar', time: 'há 11 min' },
  { name: 'Fernanda A.', city: 'CE', action: 'encontrou restrição que ninguém contou', time: 'há 15 min' },
  { name: 'Rafael O.', city: 'DF', action: 'consultou inquilino — achou dívida de R$ 12 mil', time: 'há 18 min' },
  { name: 'Juliana M.', city: 'RS', action: 'checou cliente antes de enviar mercadoria', time: 'há 23 min' },
  { name: 'Lucas T.', city: 'PE', action: 'evitou calote de R$ 8.200 com a consulta', time: 'há 28 min' },
];

/* ── Scan sources ── */
const SCAN_SOURCES = [
  { type: 'receita', name: 'Receita Federal', status: 'Cadastro localizado' },
  { type: 'tribunais', name: 'Tribunais de Justiça', status: '3 registros encontrados' },
  { type: 'serasa', name: 'Serasa / SPC', status: 'Score disponível' },
  { type: 'noticias', name: 'Notícias na Mídia', status: '2 menções recentes' },
  { type: 'reclamacoes', name: 'Reclamações Online', status: 'Histórico localizado' },
  { type: 'ia', name: 'Análise Inteligente', status: 'Parecer concluído' },
];

/* ── Custom SVG icons for each scan source ── */
function ScanSourceIcon({ type }: { type: string }) {
  const base = { width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", className: "c-scan__svg-icon" } as const;
  switch (type) {
    case 'receita':
      return (
        <svg {...base}>
          <path d="M10 2L3 7h14L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="4" y="7" width="12" height="10" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7" y1="10" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <line x1="13" y1="10" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'tribunais':
      return (
        <svg {...base}>
          <line x1="10" y1="3" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
          <line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 11L4 6l2 5H2z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M14 11l2-5 2 5h-4z" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <rect x="7" y="14" width="6" height="2.5" rx="1" fill="currentColor" />
        </svg>
      );
    case 'serasa':
      return (
        <svg {...base}>
          <rect x="3" y="12" width="3.5" height="6" rx="0.5" fill="currentColor" opacity="0.5" />
          <rect x="8.25" y="7" width="3.5" height="11" rx="0.5" fill="currentColor" opacity="0.7" />
          <rect x="13.5" y="3" width="3.5" height="15" rx="0.5" fill="currentColor" />
        </svg>
      );
    case 'noticias':
      return (
        <svg {...base}>
          <rect x="2" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="5" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="5" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'reclamacoes':
      return (
        <svg {...base}>
          <path d="M3 9v2.5h2.5l5.5 4V5L6 9H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          <path d="M14 8.2c.7.7.7 3.2 0 3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16.2 6.2c1.4 1.4 1.4 6.2 0 7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'ia':
      return (
        <svg {...base}>
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="6.5" r="1.8" fill="currentColor" />
          <circle cx="6" cy="13" r="1.8" fill="currentColor" />
          <circle cx="14" cy="13" r="1.8" fill="currentColor" />
          <line x1="10" y1="8.3" x2="6" y2="11.2" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="8.3" x2="14" y2="11.2" stroke="currentColor" strokeWidth="1" />
          <line x1="6" y1="13" x2="14" y2="13" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
}

interface PageProps {
  params: { term: string }
}

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMaintenance = searchParams?.get('variant') === 'maintenance';

  const getDocumentType = (value: string | undefined): 'CPF' | 'CNPJ' | 'DOCUMENTO' => {
    if (!value) return 'DOCUMENTO';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) return 'CPF';
    if (cleaned.length === 14) return 'CNPJ';
    return 'DOCUMENTO';
  };

  const formattedTerm = formatDocument(params.term);
  const documentType = getDocumentType(params.term);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);
  const [userEmail, setUserEmail] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toastIndex, setToastIndex] = React.useState(0);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [consultaCount, setConsultaCount] = React.useState(2347);

  // Check session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUserEmail(data.email || '');
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  // Social proof toast cycling
  React.useEffect(() => {
    if (isMaintenance) return;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const show = () => {
      setToastIndex(idx);
      setToastVisible(true);
      timer = setTimeout(() => {
        setToastVisible(false);
        idx = (idx + 1) % SOCIAL_PROOF.length;
        timer = setTimeout(show, 6000 + Math.random() * 4000);
      }, 5000);
    };
    timer = setTimeout(show, 5000 + Math.random() * 3000);
    return () => clearTimeout(timer);
  }, [isMaintenance]);

  // Live counter — increments slowly for "active platform" feel
  React.useEffect(() => {
    if (isMaintenance) return;
    const interval = setInterval(() => {
      setConsultaCount(prev => prev + 1);
    }, 45000 + Math.random() * 30000);
    return () => clearInterval(interval);
  }, [isMaintenance]);

  const createPurchase = async (
    customerFields?: {
      email?: string
      name?: string
      cellphone?: string
      buyerTaxId?: string
      password?: string
    },
    checkoutTab?: Window | null
  ) => {
    const body: Record<string, unknown> = {
      term: params.term,
      termsAccepted: true,
    };
    if (customerFields?.email) body.email = customerFields.email;
    if (customerFields?.name) body.name = customerFields.name;
    if (customerFields?.cellphone) body.cellphone = customerFields.cellphone;
    if (customerFields?.buyerTaxId) body.buyerTaxId = customerFields.buyerTaxId;
    if (customerFields?.password) body.password = customerFields.password;

    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.status === 409 && data.existingReportId) {
      checkoutTab?.close();
      alert('Você já possui um relatório ativo para este documento.');
      router.push(`/relatorio/${data.existingReportId}`);
      return;
    }

    if (!res.ok) {
      checkoutTab?.close();
      throw new Error(data.error || 'Erro ao criar compra');
    }

    if (data.checkoutUrl && checkoutTab) {
      // Checkout opens in pre-opened tab; current tab goes to confirmation
      checkoutTab.location.href = data.checkoutUrl;
      router.push(`/compra/confirmacao?code=${data.code}`);
    } else if (data.checkoutUrl) {
      // Popup blocked — fallback to same-tab redirect
      window.location.href = data.checkoutUrl;
    } else {
      // Bypass mode — no external checkout
      router.push(`/compra/confirmacao?code=${data.code}`);
    }
  };

  const handlePurchaseLoggedIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      await createPurchase();
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err instanceof Error ? err.message : 'Erro ao processar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const isLoginMode = !data.name;

      if (isLoginMode) {
        // Login mode: authenticate first, then purchase
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(loginData.error || 'Erro ao fazer login');
        }
        // Logged in — create purchase (password not needed, user already has account)
        await createPurchase({
          email: data.email,
        });
      } else {
        // Register mode: defer account creation — pass all data to purchases route
        // Account is activated only after payment succeeds (webhook sets passwordHash)
        await createPurchase({
          email: data.email,
          name: data.name,
          cellphone: data.cellphone,
          buyerTaxId: data.taxId,
          password: data.password,
        });
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="consulta-page">
      {/* NAV */}
      <TopBar email={userEmail} onLoginClick={() => setModalOpen(true)} />

      <main className="c-main">
        <div className="dossier">
          {/* Metal binder clip — large and realistic */}
          <div className="dossier__clip" aria-hidden="true">
            <svg width="120" height="52" viewBox="0 0 120 52" fill="none">
              {/* Wire arms going behind paper */}
              <path d="M38 52V26c0-12 9-18 22-18s22 6 22 18v26" stroke="#7A7A7A" strokeWidth="3" fill="none" />
              {/* Main bar body */}
              <rect x="24" y="16" width="72" height="20" rx="3" fill="url(#clipGrad2)" stroke="#6A6A6A" strokeWidth="0.75" />
              {/* Highlight streak */}
              <rect x="36" y="21" width="48" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
              {/* Shadow line */}
              <rect x="36" y="28" width="48" height="1" rx="0.5" fill="rgba(0,0,0,0.08)" />
              {/* Side grips */}
              <rect x="26" y="19" width="4" height="14" rx="1" fill="rgba(0,0,0,0.06)" />
              <rect x="90" y="19" width="4" height="14" rx="1" fill="rgba(0,0,0,0.06)" />
              <defs>
                <linearGradient id="clipGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D0D0D0" />
                  <stop offset="20%" stopColor="#B8B8B8" />
                  <stop offset="50%" stopColor="#C4C4C4" />
                  <stop offset="80%" stopColor="#A8A8A8" />
                  <stop offset="100%" stopColor="#989898" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Paper corner fold — top right */}
          <div className="dossier__corner dossier__corner--tr" aria-hidden="true" />

          <div className="dossier__body">

            {/* ═══════════════════════════════════════════════════════
                COVER SHEET (dark) — The Hook
                ═══════════════════════════════════════════════════════ */}
            <section className="c-hero">
              <div className="c-hero__inner">
                <span className="c-hero__pill">
                  {isMaintenance ? 'SISTEMA EM MANUTENÇÃO' : `RELATÓRIO COMPLETO · ${documentType}`}
                </span>

                <h1 className="c-hero__headline">
                  {isMaintenance
                    ? 'Sistema temporariamente indisponível'
                    : <>Desbloqueie relatório<br />completo deste <strong>{documentType}</strong></>
                  }
                </h1>

                {!isMaintenance && (
                  <p className="c-hero__docnum">{formattedTerm}</p>
                )}

                {!isMaintenance && (
                  <p className="c-hero__subline">
                    Nossa inteligência encontrou dados em <strong>6 bases oficiais</strong>
                  </p>
                )}

                {isMaintenance && <MaintenanceCallout />}
                {isMaintenance && <LeadCaptureForm />}

                {/* Scan results — staggered reveal with sweep animation */}
                {!isMaintenance && (
                  <div className="c-scan">
                    <div className="c-scan__header">
                      <span className="c-scan__live-indicator" />
                      <span className="c-scan__header-text">VARREDURA EM TEMPO REAL</span>
                    </div>
                    {SCAN_SOURCES.map((src, i) => (
                      <div
                        key={src.name}
                        className="c-scan__row"
                        style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                      >
                        <span className="c-scan__check" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="7" fill="#2D9F4E"/>
                            <polyline points="4,7 6,9.5 10,4.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <span className="c-scan__icon">
                          <ScanSourceIcon type={src.type} />
                        </span>
                        <span className="c-scan__name">{src.name}</span>
                        <span className="c-scan__dot" />
                        <span className="c-scan__status">{src.status}</span>
                      </div>
                    ))}
                    <div className="c-scan__footer">
                      <span className="c-scan__footer-check">&#10003;</span>
                      Varredura concluída &middot; 6/6 bases consultadas
                    </div>
                    <div className="c-scan__sweep" aria-hidden="true" />
                  </div>
                )}

                {/* Trust stamps — official seals */}
                {!isMaintenance && (
                  <div className="c-stamps">
                    <div className="c-stamp">
                      <div className="c-stamp__seal">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <rect x="3" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M6.5 10V7a4.5 4.5 0 0 1 9 0v3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <circle cx="11" cy="14.5" r="1.5" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="c-stamp__label">PAGAMENTO<br />SEGURO</span>
                    </div>
                    <div className="c-stamp">
                      <div className="c-stamp__seal">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <path d="M11 1L2 5.5v5.5c0 6 3.8 10.2 9 12 5.2-1.8 9-6 9-12V5.5L11 1z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                          <polyline points="7.5,11 10,13.5 14.5,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="c-stamp__label">DADOS<br />PROTEGIDOS</span>
                    </div>
                    <div className="c-stamp">
                      <div className="c-stamp__seal">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <path d="M12.5 1L5.5 12h5l-1 9 7.5-11h-5l1.5-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                      <span className="c-stamp__label">PRONTO<br />EM 3 MIN</span>
                    </div>
                  </div>
                )}

                {/* Urgency warning */}
                {!isMaintenance && (
                  <p className="c-hero__urgency">
                    Dados públicos podem ser atualizados a qualquer momento
                  </p>
                )}

                {/* Live counter */}
                {!isMaintenance && (
                  <p className="c-hero__counter">
                    <span className="c-hero__live-dot" />
                    +{consultaCount.toLocaleString('pt-BR')} consultas realizadas
                  </p>
                )}

                {/* CTA — preserve "DESBLOQUEAR" text for E2E */}
                <div className="c-hero__cta-wrap">
                  {isLoggedIn === null ? (
                    <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
                      <EopixLoader size="sm" />
                    </div>
                  ) : isLoggedIn ? (
                    <form onSubmit={handlePurchaseLoggedIn}>
                      <button
                        type="submit"
                        disabled={isMaintenance || isLoading}
                        className="btn btn--cta btn--lg btn--full btn--glow consulta-cta"
                      >
                        {isLoading ? <span className="epl-inline"><EopixLoader size="sm" />Processando...</span> : isMaintenance ? 'Indisponível' : 'DESBLOQUEAR RELATÓRIO · R$ 29,90'}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      disabled={isMaintenance || isLoading}
                      className="btn btn--cta btn--lg btn--full btn--glow consulta-cta"
                    >
                      {isMaintenance ? 'Indisponível' : 'DESBLOQUEAR RELATÓRIO · R$ 29,90'}
                    </button>
                  )}
                </div>

                {/* Terms */}
                <p className="c-hero__terms">
                  Ao prosseguir, você aceita os{' '}
                  <a href="#termos">Termos de Uso</a> e{' '}
                  <a href="#privacidade">Política de Privacidade</a>
                </p>
              </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FOLD SEPARATOR
                ═══════════════════════════════════════════════════════ */}
            {!isMaintenance && (
              <div className="dossier__fold" aria-hidden="true">
                <div className="dossier__fold-line" />
                <svg className="dossier__fold-clip" width="20" height="32" viewBox="0 0 20 32" fill="none">
                  <path d="M16 2c0-1-1-2-2-2H6C5 0 4 1 4 2v26c0 2 1.5 4 4 4h4c2.5 0 4-2 4-4V8c0-1-1-2-2-2H8c-1 0-2 1-2 2v16" stroke="#999" strokeWidth="1.2" fill="none" />
                </svg>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                PREVIEW — Pinned note with tape
                ═══════════════════════════════════════════════════════ */}
            {!isMaintenance && (
              <section className="c-preview">
                <h2 className="c-preview__title">Trecho do relatório encontrado</h2>

                <div className="c-note">
                  {/* Red pushpin */}
                  <div className="c-note__pin" aria-hidden="true">
                    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                      <circle cx="12" cy="8" r="7" fill="#CC3333"/>
                      <circle cx="12" cy="8" r="4" fill="#E04444"/>
                      <ellipse cx="10" cy="6.5" rx="2" ry="1.2" fill="rgba(255,255,255,0.35)" transform="rotate(-20 10 6.5)"/>
                      <rect x="11" y="14" width="2" height="16" rx="1" fill="#999"/>
                      <rect x="11" y="14" width="1" height="16" rx="0.5" fill="#B0B0B0"/>
                    </svg>
                  </div>

                  {/* CONFIDENCIAL tape strip — diagonal across top-right */}
                  <div className="c-note__tape" aria-hidden="true">
                    <span className="c-note__tape-text">CONFIDENCIAL</span>
                  </div>

                  {/* Note paper body */}
                  <div className="c-note__body">
                    <div className="c-note__section">
                      <p className="c-note__label">SITUAÇÃO CADASTRAL</p>
                      <p className="c-note__line">Nome: <span className="c-redact">João Carlos da Silva Pereira</span></p>
                      <p className="c-note__line">{documentType}: {formattedTerm}</p>
                      <p className="c-note__line">Situação: <span className="c-redact">Regular junto a RF</span></p>
                    </div>

                    <div className="c-note__divider" />

                    <div className="c-note__section">
                      <p className="c-note__label">PROCESSOS JUDICIAIS</p>
                      <p className="c-note__line">Encontrados: <span className="c-redact">4</span> processo(s) ativo(s)</p>
                      <p className="c-note__line">Tribunal: <span className="c-redact">TJSP 2ª Vara Cível de São Paulo</span></p>
                      <p className="c-note__line">Valor da causa: <span className="c-redact">R$ 47.320,00</span></p>
                    </div>

                    <div className="c-note__divider" />

                    <div className="c-note__section">
                      <p className="c-note__label">SCORE FINANCEIRO</p>
                      <p className="c-note__line">Score: <span className="c-redact">412</span> / 1000</p>
                      <p className="c-note__line">Protestos: <span className="c-redact">2</span> registro(s)</p>
                      <p className="c-note__line">Restrições: <span className="c-redact">Pendência financeira</span></p>
                    </div>

                    <div className="c-note__divider" />

                    <div className="c-note__section">
                      <p className="c-note__label">ANÁLISE DE RISCO (IA)</p>
                      <p className="c-note__line">Nível: <span className="c-redact">Risco elevado</span></p>
                      <p className="c-note__line">Parecer: <span className="c-redact">Histórico de inadimplência recorrente com múltiplos protestos</span></p>
                    </div>
                  </div>

                  {/* Gradient fade + lock overlay */}
                  <div className="c-note__fade" />
                  <div className="c-note__lock">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <rect x="2" y="7" width="12" height="8" rx="2" fill="currentColor"/>
                      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                    Conteúdo protegido — desbloqueie para visualizar
                  </div>

                  {/* Torn bottom edge */}
                  <div className="c-note__torn" aria-hidden="true" />
                </div>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════
                FOLD SEPARATOR
                ═══════════════════════════════════════════════════════ */}
            {!isMaintenance && (
              <div className="dossier__fold" aria-hidden="true">
                <div className="dossier__fold-line" />
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                PRICE ANCHOR — The Justification
                ═══════════════════════════════════════════════════════ */}
            {!isMaintenance && (
              <section className="c-anchor">
                <p className="c-anchor__lead">Quanto custa essa informação?</p>
                <div className="c-anchor__rows">
                  <div className="c-anchor__row c-anchor__row--competitor" style={{ animationDelay: '0.1s' }}>
                    <span className="c-anchor__label">Advogado / Due diligence</span>
                    <span className="c-anchor__old">
                      <span className="c-anchor__old-text">~R$ 500</span>
                      <span className="c-anchor__slash" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="c-anchor__row c-anchor__row--competitor" style={{ animationDelay: '0.3s' }}>
                    <span className="c-anchor__label">Bureau de crédito (mensal)</span>
                    <span className="c-anchor__old">
                      <span className="c-anchor__old-text">~R$ 200/mês</span>
                      <span className="c-anchor__slash" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="c-anchor__row c-anchor__row--competitor" style={{ animationDelay: '0.5s' }}>
                    <span className="c-anchor__label">Detetive particular</span>
                    <span className="c-anchor__old">
                      <span className="c-anchor__old-text">~R$ 2.000</span>
                      <span className="c-anchor__slash" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="c-anchor__row c-anchor__row--total" style={{ animationDelay: '0.7s' }}>
                    <span className="c-anchor__label">Você gastaria pelo menos</span>
                    <span className="c-anchor__total">R$ 2.700+</span>
                  </div>
                  <div className="c-anchor__row c-anchor__row--ours">
                    <div className="c-anchor__ours-left">
                      <span className="c-anchor__ours-badge">MELHOR OPÇÃO</span>
                      <span className="c-anchor__label">EOPIX &middot; 6 fontes + IA</span>
                    </div>
                    <div className="c-anchor__price-wrap">
                      <span className="c-anchor__price">R$ 29,90</span>
                      <span className="c-anchor__savings">Economia de R$ 470</span>
                    </div>
                  </div>
                </div>
                <div className="c-anchor__urgency-strip">
                  <span className="c-anchor__urgency-dot" />
                  <span>Preço promocional &middot; Pode aumentar sem aviso</span>
                </div>
                <p className="c-anchor__note">Pagamento único &middot; Sem assinatura &middot; Pronto em 3 minutos</p>
              </section>
            )}

            {/* ═══════════════════════════════════════════════════════
                BOTTOM CTA — The Close
                ═══════════════════════════════════════════════════════ */}
            {!isMaintenance && (
              <section className="c-final">
                <p className="c-final__text">Os dados estão prontos. Desbloqueie agora.</p>
                <button
                  onClick={() => isLoggedIn ? handlePurchaseLoggedIn() : setModalOpen(true)}
                  disabled={isLoading}
                  className="btn btn--cta btn--lg btn--full consulta-cta"
                >
                  {isLoading ? <span className="epl-inline"><EopixLoader size="sm" />Processando...</span> : 'DESBLOQUEAR AGORA POR R$ 29,90'}
                </button>
                <p className="c-final__note">Pagamento 100% seguro &middot; Relatório em até 3 minutos</p>
              </section>
            )}

            {/* Legal */}
            <div className="c-legal">
              <p>
                Organizamos informações públicas. Não garantimos veracidade. Não fazemos juízo de valor.
                Decisão e responsabilidade são sempre do usuário.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer" role="contentinfo">
        <div className="footer__inner">
          <div className="footer__brand"><LogoFundoPreto /></div>
          <p className="footer__legal">
            Organizamos informações públicas. Não garantimos veracidade. Não fazemos juízo de valor. Decisão e responsabilidade são sempre do usuário.
            <br/>
            Não é detector de pilantra. É um espelho comercial. Se o reflexo incomodar, o problema não é o espelho.
          </p>
          <ul className="footer__links">
            <li><a href="#" className="footer__link">Termos de uso</a></li>
            <li><a href="#" className="footer__link">Política de privacidade</a></li>
            <li><a href="#" className="footer__link">Contato</a></li>
          </ul>
          <p className="footer__copy">&copy; 2026 E o Pix? — Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Social proof toast — product-specific FOMO */}
      {!isMaintenance && (
        <div className={`c-toast ${toastVisible ? 'c-toast--visible' : ''}`} aria-live="polite">
          <div className="c-toast__avatar">
            {SOCIAL_PROOF[toastIndex]?.name?.charAt(0)}
          </div>
          <div className="c-toast__body">
            <div className="c-toast__top">
              <p className="c-toast__name">{SOCIAL_PROOF[toastIndex]?.name}</p>
              <span className="c-toast__time">{SOCIAL_PROOF[toastIndex]?.time}</span>
            </div>
            <p className="c-toast__action">
              <span className="c-toast__city">{SOCIAL_PROOF[toastIndex]?.city}</span>
              {SOCIAL_PROOF[toastIndex]?.action}
            </p>
          </div>
          <span className="c-toast__live">
            <span className="c-toast__live-dot" />
            AO VIVO
          </span>
        </div>
      )}

      {/* Registration Modal */}
      <RegisterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        isLoading={isLoading}
      />

      <style jsx global>{`
        /* ═══════════════════════════════════════════════
           CONSULTA PAGE — DOSSIE DIGITAL
           ═══════════════════════════════════════════════ */
        .consulta-page { min-height: 100vh; background: #E8E4DE; }
        .c-main { padding-top: calc(64px + 20px); padding-bottom: 48px; }

        /* ═══ DOSSIER CONTAINER ═══ */
        .dossier {
          position: relative;
          margin: 0;
          padding-top: 12px;
        }
        @media (min-width: 640px) {
          .dossier {
            max-width: 720px;
            margin: 0 auto;
            padding-top: 16px;
          }
        }

        /* Metal binder clip */
        .dossier__clip {
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 5;
          margin-bottom: -12px;
        }
        .dossier__clip svg {
          width: 120px;
          height: 52px;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.25));
        }
        @media (min-width: 640px) {
          .dossier__clip svg { width: 160px; height: 68px; }
        }

        /* Corner fold */
        .dossier__corner {
          position: absolute;
          z-index: 6;
          width: 36px;
          height: 36px;
        }
        .dossier__corner--tr {
          top: 0;
          right: 0;
          background: linear-gradient(225deg, #E8E4DE 48%, rgba(0,0,0,0.06) 49%, rgba(0,0,0,0.03) 50%, #EDE9E3 51%);
          border-radius: 0 8px 0 0;
        }
        @media (max-width: 639px) {
          .dossier__corner--tr { border-radius: 0; }
        }

        /* Dossier body — the paper */
        .dossier__body {
          position: relative;
          background:
            radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 85%, rgba(0,0,0,0.02) 0%, transparent 50%),
            #F0EFEB;
          overflow: hidden;
          border: 2px solid rgba(0,0,0,0.1);
        }
        @media (min-width: 640px) {
          .dossier__body {
            border-radius: 10px;
            border: 2.5px solid rgba(0,0,0,0.13);
            box-shadow:
              0 12px 48px rgba(0,0,0,0.18),
              0 2px 8px rgba(0,0,0,0.1),
              6px 6px 0 0 rgba(0,0,0,0.04),
              inset 0 1px 0 rgba(255,255,255,0.5);
          }
        }

        /* Paper grain texture */
        .dossier__body::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-conic-gradient(rgba(0,0,0,0.01) 0% 25%, transparent 0% 50%) 0 0 / 4px 4px;
          opacity: 0.8;
          pointer-events: none;
          z-index: 1;
        }

        /* Fold separators — perforated edge */
        .dossier__fold {
          position: relative;
          padding: 10px 0;
          z-index: 2;
          display: flex;
          align-items: center;
        }
        .dossier__fold-line {
          flex: 1;
          height: 0;
          border-top: 2px dashed rgba(0,0,0,0.08);
          margin: 0 20px;
        }
        .dossier__fold-clip {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #AAA;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        /* Staple marks on left */
        .dossier__fold::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px; height: 12px;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 1px;
          background: rgba(0,0,0,0.02);
        }

        /* ═══════════════════════════════════════════════
           HERO — Cover sheet (dark classified)
           ═══════════════════════════════════════════════ */
        .c-hero {
          position: relative;
          z-index: 2;
          background:
            repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(255,214,0,0.04) 7px, rgba(255,214,0,0.04) 8px),
            var(--primitive-black-900);
          padding: 44px 20px 32px;
        }
        @media (min-width: 640px) {
          .c-hero { padding: 52px 48px 40px; }
        }
        .c-hero__inner { max-width: 480px; margin: 0 auto; text-align: center; }

        .c-hero__pill {
          display: inline-block; font-family: var(--font-family-body); font-size: 9px; font-weight: 700;
          letter-spacing: 2.5px; text-transform: uppercase; color: var(--primitive-yellow-500);
          border: 1px solid rgba(255,214,0,0.2); padding: 5px 16px; border-radius: 9999px; margin-bottom: 24px;
        }

        .c-hero__headline {
          font-family: var(--font-family-heading); font-size: 26px; font-weight: 700;
          color: #FFF; line-height: 1.2; margin: 0 0 20px; letter-spacing: -0.5px;
        }
        .c-hero__headline strong { color: var(--primitive-yellow-500); font-weight: 700; }
        @media (min-width: 640px) { .c-hero__headline { font-size: 36px; } }

        .c-hero__docnum {
          font-family: var(--font-family-heading); font-size: 30px; font-weight: 700;
          color: rgba(255,255,255,0.9); letter-spacing: 3px; margin: 0 0 12px;
        }
        @media (min-width: 640px) { .c-hero__docnum { font-size: 40px; letter-spacing: 4px; } }

        .c-hero__subline {
          font-family: var(--font-family-body); font-size: 14px; font-weight: 400;
          color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0 0 24px;
        }
        .c-hero__subline strong { color: rgba(255,255,255,0.9); font-weight: 700; }

        /* ═══ SCAN PANEL ═══ */
        .c-scan {
          position: relative; overflow: hidden;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,214,0,0.1);
          border-radius: 12px; padding: 0 16px 4px; margin: 0 auto 20px; max-width: 400px;
          box-shadow: 0 0 30px rgba(255,214,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .c-scan__header {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 0 8px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .c-scan__live-indicator {
          width: 6px; height: 6px; border-radius: 50%; background: #2D9F4E;
          animation: pulse-dot 2s ease infinite;
        }
        .c-scan__header-text {
          font-family: var(--font-family-body); font-size: 8px; font-weight: 700;
          letter-spacing: 2px; color: rgba(255,214,0,0.5); text-transform: uppercase;
        }
        .c-scan__row {
          display: flex; align-items: center; gap: 10px; padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          opacity: 0; animation: scan-in 0.4s ease forwards;
        }
        .c-scan__row:last-of-type { border-bottom: none; }
        .c-scan__check { flex-shrink: 0; display: flex; }
        .c-scan__icon {
          flex-shrink: 0; display: flex; align-items: center;
          color: rgba(255,214,0,0.65);
        }

        /* SVG icon glow */
        .c-scan__svg-icon {
          filter: drop-shadow(0 0 3px rgba(255,214,0,0.25));
          animation: icon-glow 2.5s ease-in-out infinite;
        }
        @keyframes icon-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(255,214,0,0.2)); }
          50% { filter: drop-shadow(0 0 8px rgba(255,214,0,0.5)); }
        }

        .c-scan__name { font-family: var(--font-family-body); font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; }
        .c-scan__dot {
          flex: 1; height: 1px; min-width: 16px;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 6px);
        }
        .c-scan__status { font-family: var(--font-family-body); font-size: 10px; font-weight: 500; color: rgba(255,214,0,0.65); white-space: nowrap; letter-spacing: 0.2px; }
        .c-scan__footer {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 0; font-family: var(--font-family-body); font-size: 10px;
          color: rgba(255,255,255,0.3); border-top: 1px solid rgba(255,255,255,0.06);
          opacity: 0; animation: scan-in 0.5s ease forwards; animation-delay: 1.3s;
        }
        .c-scan__footer-check { color: #2D9F4E; font-weight: 700; }

        /* Sweep line */
        .c-scan__sweep {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,214,0,0.6) 50%, transparent 100%);
          animation: sweep-down 3.5s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes sweep-down {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes scan-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        /* ═══ TRUST STAMPS ═══ */
        .c-stamps {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin: 24px 0 20px;
        }
        @media (min-width: 640px) { .c-stamps { gap: 36px; } }

        .c-stamp {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          opacity: 0;
          animation: stamp-slam 0.35s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .c-stamp:nth-child(1) { --stamp-rot: -3deg; animation-delay: 1.5s; }
        .c-stamp:nth-child(2) { --stamp-rot: 2.5deg; animation-delay: 1.7s; }
        .c-stamp:nth-child(3) { --stamp-rot: -1.5deg; animation-delay: 1.9s; }

        @keyframes stamp-slam {
          0% { opacity: 0; transform: rotate(var(--stamp-rot, 0deg)) scale(2); }
          55% { opacity: 1; transform: rotate(var(--stamp-rot, 0deg)) scale(0.9); }
          75% { transform: rotate(var(--stamp-rot, 0deg)) scale(1.05); }
          100% { opacity: 1; transform: rotate(var(--stamp-rot, 0deg)) scale(1); }
        }

        .c-stamp__seal {
          width: 56px; height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(255,214,0,0.3);
          display: flex; align-items: center; justify-content: center;
          position: relative;
          color: rgba(255,214,0,0.6);
        }
        @media (min-width: 640px) { .c-stamp__seal { width: 64px; height: 64px; } }

        /* Double border (inner ring) */
        .c-stamp__seal::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          border: 1px solid rgba(255,214,0,0.18);
        }
        .c-stamp__label {
          font-family: var(--font-family-body); font-size: 8px; font-weight: 700;
          letter-spacing: 1.2px; text-transform: uppercase; text-align: center;
          color: rgba(255,255,255,0.35); line-height: 1.4;
        }

        /* ═══ URGENCY ═══ */
        .c-hero__urgency {
          font-family: var(--font-family-body); font-size: 10px; font-weight: 500;
          color: rgba(255,180,0,0.6); margin: 0 0 16px; letter-spacing: 0.3px;
          opacity: 0; animation: scan-in 0.5s ease forwards; animation-delay: 1.6s;
        }

        /* ═══ COUNTER ═══ */
        .c-hero__counter {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: var(--font-family-body); font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.5); margin: 0 0 16px;
        }
        .c-hero__live-dot { width: 7px; height: 7px; border-radius: 50%; background: #2D9F4E; animation: pulse-dot 2s ease infinite; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* ═══ CTA ═══ */
        .c-hero__cta-wrap { margin-bottom: 16px; }
        .c-hero__cta-wrap .btn { max-width: 400px; border-radius: 8px; }
        .consulta-cta {} /* E2E compat */

        /* Terms */
        .c-hero__terms { font-family: var(--font-family-body); font-size: 9px; color: rgba(255,255,255,0.2); line-height: 1.5; margin: 0; }
        .c-hero__terms a { color: rgba(255,255,255,0.3); text-decoration: underline; }
        .c-hero__terms a:hover { color: rgba(255,255,255,0.5); }


        /* ═══════════════════════════════════════════════
           PREVIEW — Redacted report on paper
           ═══════════════════════════════════════════════ */
        .c-preview {
          position: relative; z-index: 2;
          max-width: 520px; margin: 0 auto; padding: 32px 20px 24px;
        }
        @media (min-width: 640px) { .c-preview { padding: 40px 48px 32px; } }

        .c-preview__title {
          font-family: var(--font-family-heading); font-size: 20px; font-weight: 700;
          color: var(--primitive-black-900); text-align: center; margin: 0 0 24px;
        }
        @media (min-width: 640px) { .c-preview__title { font-size: 24px; } }

        /* ═══ PINNED NOTE ═══ */
        .c-note {
          --note-paper: #FAFAF7;
          position: relative;
          max-width: 460px;
          margin: 0 auto;
          background: var(--note-paper);
          border: none;
          border-left: 3px solid var(--primitive-yellow-500);
          padding: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
          transform: rotate(-0.5deg);
        }

        /* Paper grain texture */
        .c-note::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0.6;
          pointer-events: none;
          z-index: 0;
          background:
            repeating-conic-gradient(rgba(0,0,0,0.02) 0% 25%, transparent 0% 50%) 0 0 / 3px 3px,
            radial-gradient(ellipse at 30% 20%, rgba(0,0,0,0.01) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.015) 0%, transparent 50%);
        }

        /* Red pushpin — offset left to avoid tape */
        .c-note__pin {
          position: absolute;
          top: -14px;
          left: 28px;
          z-index: 10;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        }

        /* CONFIDENCIAL tape strip — diagonal across top-right */
        .c-note__tape {
          position: absolute;
          top: 24px;
          right: -20px;
          z-index: 8;
          width: 200px;
          height: 30px;
          background: linear-gradient(180deg, rgba(255,214,0,0.7) 0%, rgba(255,214,0,0.5) 100%);
          transform: rotate(28deg);
          transform-origin: center;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          border-top: 1px solid rgba(255,255,255,0.4);
          border-bottom: 1px solid rgba(200,170,0,0.3);
        }
        /* Tape ragged/torn edges */
        .c-note__tape::before,
        .c-note__tape::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 12px;
        }
        .c-note__tape::before {
          left: -1px;
          background: linear-gradient(90deg, transparent 30%, rgba(255,214,0,0.5));
          mask-image: linear-gradient(180deg, transparent 10%, black 30%, transparent 50%, black 70%, transparent 90%);
          -webkit-mask-image: linear-gradient(180deg, transparent 10%, black 30%, transparent 50%, black 70%, transparent 90%);
        }
        .c-note__tape::after {
          right: -1px;
          background: linear-gradient(270deg, transparent 30%, rgba(255,214,0,0.5));
          mask-image: linear-gradient(180deg, transparent 15%, black 35%, transparent 55%, black 75%, transparent 95%);
          -webkit-mask-image: linear-gradient(180deg, transparent 15%, black 35%, transparent 55%, black 75%, transparent 95%);
        }
        .c-note__tape-text {
          font-family: var(--font-family-body);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: rgba(0,0,0,0.7);
          text-shadow: 0 0.5px 0 rgba(255,255,255,0.3);
        }
        @media (min-width: 640px) {
          .c-note__tape { width: 240px; height: 34px; top: 28px; right: -24px; }
          .c-note__tape-text { font-size: 10px; letter-spacing: 5px; }
        }

        /* Note body */
        .c-note__body {
          position: relative;
          z-index: 1;
          padding: 28px 24px 60px;
        }
        @media (min-width: 640px) { .c-note__body { padding: 32px 32px 64px; } }

        .c-note__section { margin-bottom: 4px; }
        .c-note__label {
          font-family: var(--font-family-body); font-size: 9px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: rgba(0,0,0,0.35); margin: 0 0 6px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-bottom: 4px;
        }
        .c-note__line {
          font-family: var(--font-family-body); font-size: 12px; line-height: 1.8;
          color: rgba(0,0,0,0.6); margin: 0;
        }
        .c-note__divider {
          height: 0;
          border-top: 1px dashed rgba(0,0,0,0.08);
          margin: 10px 0;
        }
        .c-redact {
          color: rgba(0,0,0,0.5); background: rgba(255,214,0,0.12);
          border-radius: 2px; padding: 1px 4px; user-select: none;
          filter: blur(4px);
        }

        /* Gradient fade */
        .c-note__fade {
          position: absolute; bottom: 40px; left: 0; right: 0; height: 80px;
          background: linear-gradient(to bottom, transparent, var(--note-paper));
          pointer-events: none;
          z-index: 2;
        }

        /* Lock bar */
        .c-note__lock {
          position: absolute; bottom: 0; left: 0; right: 0;
          z-index: 3;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 10px 16px;
          background: var(--primitive-black-900);
          font-family: var(--font-family-body); font-size: 11px; font-weight: 600;
          color: rgba(255,214,0,0.7); letter-spacing: 0.3px;
        }
        .c-note__lock svg { color: rgba(255,214,0,0.6); }

        /* Torn bottom edge — zigzag like mc-card */
        .c-note__torn {
          position: relative;
          width: 100%;
          height: 8px;
          background-image:
            linear-gradient(135deg, var(--note-paper) 33.33%, transparent 33.33%),
            linear-gradient(225deg, var(--note-paper) 33.33%, transparent 33.33%);
          background-size: 8px 100%;
          background-repeat: repeat-x;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.04));
        }

        /* ═══════════════════════════════════════════════
           PRICE ANCHOR — on paper background
           ═══════════════════════════════════════════════ */
        .c-anchor {
          position: relative; z-index: 2;
          max-width: 480px; margin: 0 auto; padding: 24px 20px 32px;
        }
        @media (min-width: 640px) { .c-anchor { padding: 32px 48px 40px; } }

        .c-anchor__lead {
          font-family: var(--font-family-heading); font-size: 18px; font-weight: 700;
          color: var(--primitive-black-900); text-align: center; margin: 0 0 20px;
        }
        @media (min-width: 640px) { .c-anchor__lead { font-size: 22px; } }

        .c-anchor__rows {
          border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
          overflow: hidden; margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .c-anchor__row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-bottom: 1px solid rgba(0,0,0,0.06);
          background: #FFFFFF;
        }
        .c-anchor__row:last-child { border-bottom: none; }
        .c-anchor__label { font-family: var(--font-family-body); font-size: 13px; color: rgba(0,0,0,0.5); }

        /* Competitor rows — staggered entrance + animated strikethrough */
        .c-anchor__row--competitor {
          opacity: 0;
          animation: anchor-row-in 0.5s ease forwards;
        }
        @keyframes anchor-row-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .c-anchor__old {
          position: relative;
          font-family: var(--font-family-body); font-size: 13px; font-weight: 600;
          color: rgba(180,40,40,0.55);
        }
        .c-anchor__old-text { position: relative; }
        /* Animated red slash through old price */
        .c-anchor__slash {
          position: absolute;
          left: -2px; right: -2px;
          top: 50%;
          height: 2px;
          background: rgba(200,50,50,0.5);
          transform: scaleX(0);
          transform-origin: left;
          animation: slash-through 0.4s ease forwards;
          animation-delay: inherit;
        }
        .c-anchor__row--competitor:nth-child(1) .c-anchor__slash { animation-delay: 0.6s; }
        .c-anchor__row--competitor:nth-child(2) .c-anchor__slash { animation-delay: 0.9s; }
        .c-anchor__row--competitor:nth-child(3) .c-anchor__slash { animation-delay: 1.2s; }
        @keyframes slash-through {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* Total row — sum of competitors */
        .c-anchor__row--total {
          background: rgba(200,50,50,0.04);
          border-bottom: 2px solid rgba(200,50,50,0.1);
          opacity: 0;
          animation: anchor-row-in 0.5s ease forwards;
        }
        .c-anchor__row--total .c-anchor__label {
          font-weight: 600; color: rgba(0,0,0,0.45); font-size: 12px;
        }
        .c-anchor__total {
          font-family: var(--font-family-heading); font-size: 18px; font-weight: 700;
          color: rgba(180,40,40,0.6);
          text-decoration: line-through;
          text-decoration-color: rgba(200,50,50,0.4);
          text-decoration-thickness: 2px;
        }

        /* EOPIX row — bold highlight */
        .c-anchor__row--ours {
          background: var(--primitive-black-900); border-bottom: none;
          padding: 18px 20px;
          opacity: 0;
          animation: ours-reveal 0.6s cubic-bezier(0.22,0.61,0.36,1) forwards;
          animation-delay: 1.4s;
        }
        @keyframes ours-reveal {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .c-anchor__ours-left { display: flex; flex-direction: column; gap: 4px; }
        .c-anchor__ours-badge {
          display: inline-block; width: fit-content;
          font-family: var(--font-family-body); font-size: 7px; font-weight: 800;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--primitive-black-900); background: var(--primitive-yellow-500);
          padding: 2px 8px; border-radius: 3px;
        }
        .c-anchor__row--ours .c-anchor__label { color: #FFF; font-weight: 600; }
        .c-anchor__price-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .c-anchor__price {
          font-family: var(--font-family-heading); font-size: 26px; font-weight: 700;
          color: var(--primitive-yellow-500);
        }
        .c-anchor__savings {
          display: inline-block;
          font-family: var(--font-family-body); font-size: 9px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          color: #2D9F4E; background: rgba(45,159,78,0.15);
          padding: 3px 10px; border-radius: 4px;
        }

        .c-anchor__urgency-strip {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 16px; margin-bottom: 10px;
          font-family: var(--font-family-body); font-size: 11px; font-weight: 600;
          color: rgba(204,51,51,0.75);
          background: rgba(204,51,51,0.04);
          border-radius: 6px;
          border: 1px solid rgba(204,51,51,0.08);
          animation: urgency-pulse 3s ease-in-out infinite;
        }
        .c-anchor__urgency-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #CC3333;
          animation: pulse-dot 2s ease infinite;
        }
        @keyframes urgency-pulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        .c-anchor__note {
          font-family: var(--font-family-body); font-size: 12px;
          color: rgba(0,0,0,0.55); text-align: center; margin: 0;
        }

        /* ═══ FINAL CTA ═══ */
        .c-final {
          position: relative; z-index: 2;
          max-width: 640px; margin: 0 auto; padding: 0 24px 40px; text-align: center;
        }
        .c-final__text {
          font-family: var(--font-family-heading); font-size: 18px; font-weight: 700;
          color: var(--primitive-black-900); margin: 0 0 20px;
        }
        .c-final__note {
          font-family: var(--font-family-body); font-size: 12px;
          color: rgba(0,0,0,0.55); margin: 12px 0 0;
        }

        /* Legal */
        .c-legal {
          position: relative; z-index: 2;
          max-width: 840px; margin: 0 auto; text-align: center; padding: 0 24px 24px;
        }
        .c-legal p {
          font-family: var(--font-family-body); font-size: 11px;
          color: rgba(0,0,0,0.5); line-height: 1.6; margin: 0;
        }

        /* ═══ TOAST — bold FOMO notification ═══ */
        .c-toast {
          position: fixed; bottom: 24px; left: 24px; z-index: 100;
          display: flex; align-items: center; gap: 12px;
          background: #FFF;
          border: 2px solid var(--primitive-black-900);
          border-left: 5px solid var(--primitive-yellow-500);
          border-radius: 10px;
          padding: 14px 16px;
          box-shadow: 4px 4px 0 0 rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12);
          opacity: 0; transform: translateY(20px) scale(0.95);
          transition: opacity 0.4s cubic-bezier(0.22,0.61,0.36,1), transform 0.4s cubic-bezier(0.22,0.61,0.36,1);
          pointer-events: none;
        }
        .c-toast--visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        @media (max-width: 639px) { .c-toast { left: 12px; right: 12px; bottom: 12px; } }
        @media (min-width: 640px) { .c-toast { max-width: 340px; } }

        .c-toast__avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--primitive-black-900); color: var(--primitive-yellow-500);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-family-heading); font-size: 15px; font-weight: 700;
          flex-shrink: 0;
        }
        .c-toast__body { min-width: 0; flex: 1; }
        .c-toast__top { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
        .c-toast__name { font-family: var(--font-family-body); font-size: 13px; font-weight: 700; color: var(--primitive-black-900); margin: 0; line-height: 1.3; }
        .c-toast__time { font-family: var(--font-family-body); font-size: 10px; color: rgba(0,0,0,0.35); white-space: nowrap; }
        .c-toast__action { font-family: var(--font-family-body); font-size: 12px; color: rgba(0,0,0,0.55); margin: 0; line-height: 1.4; }
        .c-toast__city {
          display: inline-block; font-weight: 700; color: var(--primitive-black-900);
          margin-right: 4px;
        }
        .c-toast__city::after { content: ' —'; font-weight: 400; color: rgba(0,0,0,0.25); }
        .c-toast__live {
          display: flex; align-items: center; gap: 4px; flex-shrink: 0;
          font-family: var(--font-family-body); font-size: 8px; font-weight: 700;
          letter-spacing: 1px; color: #2D9F4E; text-transform: uppercase;
        }
        .c-toast__live-dot { width: 6px; height: 6px; border-radius: 50%; background: #2D9F4E; animation: pulse-dot 2s ease infinite; }
      `}</style>
    </div>
  );
}
