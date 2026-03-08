"use client"

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import ProcessingTracker from '@/components/ProcessingTracker';
import EopixLoader from '@/components/EopixLoader';

type PageState =
  | 'loading'              // Carregando dados
  | 'not_found'            // Código inválido
  | 'cancelled'            // Pagamento cancelado pelo usuário
  | 'confirming_payment'   // Webhook não chegou ainda, aguardando confirmação
  | 'approved'             // Pagamento confirmado, processando relatório
  | 'completed'            // Relatório pronto

interface PurchaseData {
  code: string
  email: string
  status: string
  processingStep: number
  hasReport: boolean
  reportId: string | null
}

function ConfirmacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseCode = searchParams.get('code') || '';
  const isCancelled = searchParams.get('cancelled') === 'true';

  const [pageState, setPageState] = React.useState<PageState>('loading');
  const [purchaseData, setPurchaseData] = React.useState<PurchaseData | null>(null);
  const [autoLoginFailed, setAutoLoginFailed] = React.useState(false);
  const [confirmingSeconds, setConfirmingSeconds] = React.useState(0);

  // Polling: atualizar progresso enquanto processando ou aguardando confirmação
  React.useEffect(() => {
    if ((pageState !== 'approved' && pageState !== 'confirming_payment') || !purchaseCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/purchases/${purchaseCode}`);
        if (!res.ok) return;
        const data = await res.json();
        setPurchaseData(data);

        if (data.status === 'COMPLETED' || data.hasReport) {
          setPageState('completed');
        } else if (pageState === 'confirming_payment' && (data.status === 'PAID' || data.status === 'PROCESSING')) {
          setPageState('approved');
        }
      } catch {
        // silently ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pageState, purchaseCode]);

  // Timer: contar segundos em confirming_payment para mostrar timeout
  React.useEffect(() => {
    if (pageState !== 'confirming_payment') {
      setConfirmingSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setConfirmingSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [pageState]);

  // Buscar dados e processar estado
  React.useEffect(() => {
    const fetchAndProcess = async () => {
      if (!purchaseCode) {
        setPageState('not_found');
        return;
      }

      try {
        const res = await fetch(`/api/purchases/${purchaseCode}`);
        if (!res.ok) {
          setPageState('not_found');
          return;
        }

        const data = await res.json();
        setPurchaseData(data);

        // Tentar auto-login ANTES de setar estado
        try {
          const loginRes = await fetch('/api/auth/auto-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: purchaseCode }),
          });
          if (!loginRes.ok) {
            setAutoLoginFailed(true);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          setAutoLoginFailed(true);
        }

        // Determinar estado baseado no status
        if (data.status === 'COMPLETED' || data.hasReport) {
          setPageState('completed');
        } else if (isCancelled && data.status === 'PENDING') {
          setPageState('cancelled');
        } else if (data.status === 'PENDING') {
          setPageState('confirming_payment');
        } else {
          setPageState('approved');
        }
      } catch (err) {
        console.error('Erro ao buscar compra:', err);
        setPageState('not_found');
      }
    };

    fetchAndProcess();
  }, [purchaseCode, isCancelled]);

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
      <div className="epl-center">
        <EopixLoader size="lg" text="Carregando" />
      </div>
    );
  }

  // Estado: Not Found
  if (pageState === 'not_found' || !purchaseCode) {
    return (
      <div className="conf-page conf-page--center">
        <div className="conf-not-found">
          <h1 className="conf-card__title">Código de compra não encontrado</h1>
          <p className="conf-card__desc">
            Verifique o link ou acesse suas consultas.
          </p>
          <Link href="/minhas-consultas" className="btn btn--cta conf-card__btn">
            Ir para Minhas Consultas
          </Link>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (pageState) {
      case 'cancelled':
        return (
          <>
            <div className="conf-stamp conf-stamp--error">CANCELADO</div>
            <h1 className="conf-card__title">Pagamento não concluído</h1>
            <p className="conf-card__desc">
              O pagamento foi cancelado. Você pode tentar novamente a qualquer momento.
            </p>
            <Link href="/" className="btn btn--cta conf-card__btn">
              TENTAR NOVAMENTE
            </Link>
          </>
        );

      case 'confirming_payment':
        return (
          <>
            <div className="conf-card__icon conf-card__icon--waiting">
              <EopixLoader size="sm" />
            </div>
            <h1 className="conf-card__title">Confirmando seu pagamento...</h1>
            <p className="conf-card__desc">
              Estamos verificando a confirmação do seu pagamento. Isso geralmente leva alguns segundos.
            </p>
            <div className="conf-card__code">
              <span className="conf-card__code-label">Código: </span>
              <span className="conf-card__code-value">#{purchaseCode}</span>
            </div>
            {confirmingSeconds > 60 && (
              <div className="conf-card__timeout">
                <p>
                  Está demorando mais que o esperado. Se você já pagou, entre em contato pelo email suporte@eopix.app com o código <strong>#{purchaseCode}</strong>.
                </p>
              </div>
            )}
          </>
        );

      case 'approved': {
        const currentStep = purchaseData?.processingStep || 0;
        const isFailed = purchaseData?.status === 'FAILED';

        return (
          <>
            <div className="conf-stamp conf-stamp--approved">APROVADO</div>
            <h1 className="conf-card__title">Compra aprovada!</h1>
            <p className="conf-card__desc">
              Pagamento confirmado! Estamos gerando seu relatório.
            </p>

            <div className="conf-card__tracker">
              <ProcessingTracker
                currentStep={currentStep}
                variant="full"
                failed={isFailed}
              />
            </div>

            <div className="conf-card__code">
              <span className="conf-card__code-label">Código: </span>
              <span className="conf-card__code-value">#{purchaseCode}</span>
            </div>

            {autoLoginFailed ? (
              <div className="conf-card__auth">
                <p className="conf-card__auth-text">
                  Para acompanhar seu relatório, faça login:
                </p>
                <AuthForm mode="login" onSuccess={handleGoToConsultas} />
              </div>
            ) : (
              <button
                onClick={handleGoToConsultas}
                className="btn btn--cta conf-card__btn"
              >
                ACOMPANHAR MEU RELATÓRIO
              </button>
            )}
          </>
        );
      }

      case 'completed':
        return (
          <>
            <div className="conf-stamp conf-stamp--completed">CONCLUÍDO</div>
            <h1 className="conf-card__title">Relatório pronto!</h1>
            <p className="conf-card__desc">
              Seu relatório está disponível para visualização.
            </p>
            <div className="conf-card__code">
              <span className="conf-card__code-label">Código: </span>
              <span className="conf-card__code-value">#{purchaseCode}</span>
            </div>
            {purchaseData?.reportId && (
              <button
                onClick={handleViewReport}
                className="btn btn--cta conf-card__btn"
              >
                VER RELATÓRIO
              </button>
            )}
            <button
              onClick={handleGoToConsultas}
              className="btn btn--outline conf-card__btn conf-card__btn--secondary"
            >
              VER TODOS OS RELATÓRIOS
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="conf-page">
      <TopBar />
      <main className="conf-main">
        <div className="conf-main__inner">
          <div className="conf-card">
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="conf-page" />}>
      <ConfirmacaoContent />
    </Suspense>
  );
}
