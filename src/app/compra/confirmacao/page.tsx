"use client"

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';

type PageState =
  | 'loading'           // Carregando dados
  | 'not_found'         // Código inválido
  | 'approved'          // Pagamento feito, processando relatório
  | 'completed'         // Relatório pronto

interface PurchaseData {
  code: string
  email: string
  status: string
  processingStep: number
  hasReport: boolean
  reportId: string | null
}

const PROCESSING_STEPS = [
  { step: 1, label: 'Dados cadastrais' },
  { step: 2, label: 'Dados financeiros' },
  { step: 3, label: 'Processos judiciais' },
  { step: 4, label: 'Menções na web' },
  { step: 5, label: 'Gerando resumo' },
  { step: 6, label: 'Finalizando' },
];

function ConfirmacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseCode = searchParams.get('code') || '';

  const [pageState, setPageState] = React.useState<PageState>('loading');
  const [purchaseData, setPurchaseData] = React.useState<PurchaseData | null>(null);

  // Polling: atualizar progresso enquanto processando
  React.useEffect(() => {
    if (pageState !== 'approved' || !purchaseCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/purchases/${purchaseCode}`);
        if (!res.ok) return;
        const data = await res.json();
        setPurchaseData(data);

        if (data.status === 'COMPLETED' || data.hasReport) {
          setPageState('completed');
        }
      } catch {
        // silently ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pageState, purchaseCode]);

  // Buscar dados e processar estado
  React.useEffect(() => {
    const fetchAndProcess = async () => {
      if (!purchaseCode) {
        setPageState('not_found');
        return;
      }

      try {
        // 1. Buscar dados da compra
        const res = await fetch(`/api/purchases/${purchaseCode}`);
        if (!res.ok) {
          setPageState('not_found');
          return;
        }

        const data = await res.json();
        setPurchaseData(data);

        // 2. Tentar auto-login ANTES de setar estado
        try {
          const loginRes = await fetch('/api/auth/auto-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: purchaseCode }),
          });
          // We don't need to track login state — session cookie is set automatically
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
        }

        // 3. Determinar estado baseado no status
        if (data.status === 'COMPLETED' || data.hasReport) {
          setPageState('completed');
        } else {
          setPageState('approved'); // PENDING, PAID, ou PROCESSING — pagamento já feito
        }
      } catch (err) {
        console.error('Erro ao buscar compra:', err);
        setPageState('not_found');
      }
    };

    fetchAndProcess();
  }, [purchaseCode]);

  const handleGoToConsultas = () => {
    router.push('/minhas-consultas');
  };

  const handleViewReport = () => {
    if (purchaseData?.reportId) {
      router.push(`/relatorio/${purchaseData.reportId}`);
    }
  };

  // Estado: Loading
  if (pageState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-secondary)' }} />
          <p style={{ fontFamily: 'var(--font-family-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginTop: '16px' }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  // Estado: Not Found
  if (pageState === 'not_found' || !purchaseCode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '24px', marginBottom: '16px' }}>
            Codigo de compra nao encontrado
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Verifique o link ou acesse suas consultas.
          </p>
          <Link href="/minhas-consultas" className="btn btn--primary">
            Ir para Minhas Consultas
          </Link>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo baseado no estado
  const renderContent = () => {
    switch (pageState) {
      case 'approved': {
        const currentStep = purchaseData?.processingStep || 0;
        const progressPercent = currentStep > 0 ? (currentStep / 6) * 100 : 0;
        const currentStepInfo = PROCESSING_STEPS.find(s => s.step === currentStep);

        return (
          <>
            {/* Ícone de Check */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckCircle size={24} color="#FFFFFF" />
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 'var(--primitive-weight-bold)',
              color: 'var(--color-text-primary)',
              marginTop: 'var(--primitive-space-4)',
              marginBottom: 0
            }}>
              Compra aprovada!
            </h1>

            {/* Descrição */}
            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--primitive-space-4)',
              lineHeight: 1.6
            }}>
              Pagamento confirmado! Estamos gerando seu relatorio.
            </p>

            {/* Progresso */}
            <div style={{ marginTop: 'var(--primitive-space-5)', textAlign: 'left' }}>
              {/* Label da etapa atual */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: '2px solid var(--color-border-subtle)',
                    borderTopColor: 'var(--primitive-yellow)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}>
                    {currentStepInfo ? currentStepInfo.label : 'Iniciando processamento...'}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                }}>
                  {currentStep}/6
                </span>
              </div>

              {/* Barra de progresso */}
              <div style={{
                height: '6px',
                background: 'var(--color-bg-secondary)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--primitive-yellow) 0%, #E6C200 100%)',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease-out',
                }} />
              </div>

              {/* Dots indicadores */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '8px',
              }}>
                {PROCESSING_STEPS.map((s) => (
                  <div
                    key={s.step}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: currentStep >= s.step
                        ? 'var(--primitive-yellow)'
                        : 'var(--color-border-subtle)',
                      transition: 'background 0.3s ease',
                    }}
                    title={s.label}
                  />
                ))}
              </div>
            </div>

            {/* Código */}
            <div style={{
              marginTop: 'var(--primitive-space-4)',
              fontFamily: 'var(--font-family-body)'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Codigo:{' '}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'var(--primitive-weight-bold)', color: 'var(--color-text-primary)' }}>
                #{purchaseCode}
              </span>
            </div>

            {/* Botão */}
            <button
              onClick={handleGoToConsultas}
              className="btn btn--primary"
              style={{
                marginTop: 'var(--primitive-space-6)',
                width: '100%',
                fontSize: '14px',
                padding: '16px',
                fontWeight: 'var(--primitive-weight-bold)'
              }}
            >
              ACOMPANHAR MEU RELATORIO
            </button>
          </>
        );
      }

      case 'completed':
        return (
          <>
            {/* Ícone de Check */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-status-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <CheckCircle size={24} color="#FFFFFF" />
            </div>

            {/* Título */}
            <h1 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 'var(--primitive-weight-bold)',
              color: 'var(--color-text-primary)',
              marginTop: 'var(--primitive-space-4)',
              marginBottom: 0
            }}>
              Relatorio pronto!
            </h1>

            {/* Descrição */}
            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--primitive-space-4)',
              lineHeight: 1.6
            }}>
              Seu relatorio esta disponivel para visualizacao.
            </p>

            {/* Código */}
            <div style={{
              marginTop: 'var(--primitive-space-4)',
              fontFamily: 'var(--font-family-body)'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Codigo:{' '}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'var(--primitive-weight-bold)', color: 'var(--color-text-primary)' }}>
                #{purchaseCode}
              </span>
            </div>

            {/* Botões */}
            {purchaseData?.reportId && (
              <button
                onClick={handleViewReport}
                className="btn btn--primary"
                style={{
                  marginTop: 'var(--primitive-space-6)',
                  width: '100%',
                  fontSize: '14px',
                  padding: '16px',
                  fontWeight: 'var(--primitive-weight-bold)'
                }}
              >
                VER RELATORIO
              </button>
            )}

            <button
              onClick={handleGoToConsultas}
              className="btn btn--secondary"
              style={{
                marginTop: 'var(--primitive-space-3)',
                width: '100%',
                fontSize: '14px',
                padding: '16px',
                fontWeight: 'var(--primitive-weight-bold)'
              }}
            >
              VER TODOS OS RELATORIOS
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* NAV */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? - Pagina inicial">
            <LogoFundoPreto />
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{
        paddingTop: 'calc(64px + var(--primitive-space-10))',
        paddingBottom: 'var(--primitive-space-12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          margin: '0 var(--primitive-space-6)'
        }}>
          {/* CARD */}
          <div style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--primitive-radius-md)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: 'var(--primitive-space-10)',
            textAlign: 'center'
          }}>
            {renderContent()}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer" role="contentinfo">
        <div className="footer__inner">
          <div className="footer__brand">
            <LogoFundoPreto />
          </div>
          <p className="footer__legal">
            Organizamos informacoes publicas. Nao garantimos veracidade. Nao fazemos juizo de valor. Decisao e responsabilidade sao sempre do usuario.
            <br/>
            Nao e detector de pilantra. E um espelho comercial. Se o reflexo incomodar, o problema nao e o espelho.
          </p>
          <ul className="footer__links">
            <li><a href="#" className="footer__link">Termos de uso</a></li>
            <li><a href="#" className="footer__link">Politica de privacidade</a></li>
            <li><a href="#" className="footer__link">Contato</a></li>
          </ul>
          <p className="footer__copy">
            2026 E o Pix? - Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* CSS for spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }} />}>
      <ConfirmacaoContent />
    </Suspense>
  );
}
