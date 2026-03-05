"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import { usePurchasePolling } from '@/lib/hooks/use-purchase-polling';
import { PROCESSING_STEPS } from '@/types/domain';
import type { Purchase } from '@/types/domain';

// ============================================
// CARD DE CONSULTA
// ============================================
interface CardConsultaProps {
  purchase: Purchase;
  onViewReport: (id: string) => void;
}

function CardConsulta({ purchase, onViewReport }: CardConsultaProps) {
  const isProcessing = purchase.status === 'PROCESSING' || purchase.status === 'PAID';
  const currentStep = purchase.processingStep || 0;
  const progressPercent = isProcessing && currentStep > 0 ? (currentStep / 6) * 100 : 0;
  const currentStepInfo = PROCESSING_STEPS.find(s => s.step === currentStep);

  const getBadgeConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: '✅ CONCLUÍDO',
          bg: 'rgba(102, 204, 102, 0.15)',
          color: '#339933',
        };
      case 'PROCESSING':
      case 'PAID':
        return {
          label: '⏳ PROCESSANDO',
          bg: 'rgba(255, 214, 0, 0.15)',
          color: '#B87700',
        };
      case 'PENDING':
        return {
          label: '💳 AGUARDANDO PAGAMENTO',
          bg: 'rgba(255, 214, 0, 0.15)',
          color: '#B87700',
        };
      case 'FAILED':
        return {
          label: '❌ FALHOU',
          bg: 'rgba(204, 51, 51, 0.15)',
          color: '#CC3333',
        };
      case 'REFUND_PENDING':
        return {
          label: '⚠️ REEMBOLSO PENDENTE',
          bg: 'rgba(255, 214, 0, 0.15)',
          color: '#B87700',
        };
      case 'EXPIRED':
        return {
          label: '📅 EXPIRADO',
          bg: 'var(--color-border-subtle)',
          color: 'var(--color-text-tertiary)',
        };
      default:
        return {
          label: status,
          bg: 'var(--color-border-subtle)',
          color: 'var(--color-text-tertiary)',
        };
    }
  };

  const badge = getBadgeConfig(purchase.status);
  const documentType = purchase.type;

  return (
    <div
      style={{
        background: 'var(--primitive-white)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        padding: '20px 24px',
      }}
    >
      {/* Header: Badge + Documento + Botão */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Lado esquerdo */}
        <div>
          {/* Badge de status */}
          <div
            style={{
              display: 'inline-block',
              background: badge.bg,
              color: badge.color,
              fontFamily: 'var(--font-family-body)',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '3px',
            }}
          >
            {badge.label}
          </div>

          {/* Documento */}
          <div
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--primitive-black)',
              marginTop: '8px',
            }}
          >
            {documentType}: {purchase.term}
          </div>

          {/* Data/mensagem */}
          <div
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              marginTop: '4px',
            }}
          >
            {new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* Lado direito */}
        <div>
          {purchase.status === 'COMPLETED' && purchase.hasReport && purchase.reportId && (
            <button
              type="button"
              onClick={() => onViewReport(purchase.reportId!)}
              style={{
                background: 'var(--primitive-white)',
                color: 'var(--primitive-black)',
                border: '1px solid var(--color-text-primary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Ver Relatório
            </button>
          )}

          {purchase.status === 'PENDING' && (
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                fontStyle: 'italic',
              }}
            >
              Aguardando pagamento
            </div>
          )}

          {purchase.status === 'FAILED' && (
            <div
              style={{
                background: 'var(--color-border-subtle)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '3px',
              }}
            >
              REEMBOLSADO
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progresso (apenas quando processando) */}
      {isProcessing && (
        <div style={{ marginTop: '16px' }}>
          {/* Label da etapa atual */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Spinner animado */}
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid var(--color-border-subtle)',
                  borderTopColor: 'var(--primitive-yellow)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {currentStepInfo ? currentStepInfo.label : 'Iniciando processamento...'}
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {currentStep}/6
            </span>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* Barra de progresso */}
          <div
            style={{
              height: '6px',
              background: 'var(--color-bg-secondary)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, var(--primitive-yellow) 0%, #E6C200 100%)',
                borderRadius: '3px',
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>

          {/* Indicadores de etapas */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '8px',
            }}
          >
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
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [userEmail, setUserEmail] = React.useState('');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);

  // SSE + fallback polling for real-time updates
  const { fetchPurchases } = usePurchasePolling({
    enabled: !!isAuthenticated,
    purchases,
    setPurchases,
  });

  // Check session on mount
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/purchases');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(true);
          setPurchases(data.purchases || []);
          if (data.email) {
            setUserEmail(data.email);
          }
          if (data.isAdmin) {
            setIsAdmin(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    await fetchPurchases();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    }
    setIsAuthenticated(false);
    setPurchases([]);
    setUserEmail('');
  };

  const handleNovaConsulta = () => {
    router.push('/');
  };

  const handleViewReport = (id: string) => {
    router.push(`/relatorio/${id}`);
  };

  // ============================================
  // LOADING: CHECKING SESSION
  // ============================================
  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid var(--color-border-subtle)',
          borderTopColor: 'var(--primitive-yellow)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // SE NÃO ESTIVER AUTENTICADO: MOSTRA LOGIN
  // ============================================
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        {/* NAV */}
        <nav className="nav" aria-label="Menu principal">
          <div className="nav__inner">
            <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
              <LogoFundoPreto />
            </Link>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main style={{
          paddingTop: 'calc(64px + var(--primitive-space-10))',
          paddingBottom: 'var(--primitive-space-12)',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>

          {/* CARD CENTRALIZADO */}
          <div style={{
            maxWidth: '440px',
            width: '100%',
            margin: '0 var(--primitive-space-6)',
            background: 'var(--primitive-white)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--primitive-radius-md)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '40px'
          }}>
            <h1 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--primitive-black)',
              textAlign: 'center',
              margin: '0 0 8px 0'
            }}>
              Minhas Consultas
            </h1>

            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              textAlign: 'center',
              margin: '0 0 24px 0'
            }}>
              Entre com sua conta para acessar suas consultas.
            </p>

            <AuthForm
              mode="login"
              onSuccess={handleLoginSuccess}
            />
          </div>
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer__inner">
            <div className="footer__logo">
              <LogoFundoPreto />
            </div>

            <div className="footer__links">
              <a href="/sobre" className="footer__link">
                Sobre
              </a>
              <a href="/privacidade" className="footer__link">
                Privacidade
              </a>
              <a href="/termos" className="footer__link">
                Termos
              </a>
              <a href="/contato" className="footer__link">
                Contato
              </a>
            </div>

            <div className="footer__copyright">
              &copy; 2026 E o Pix? Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================
  // SE ESTIVER AUTENTICADO: MOSTRA LISTA DE CONSULTAS
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* ============================================ */}
      {/* NAV */}
      {/* ============================================ */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>

          {/* User + Admin + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-inverse-muted)',
              }}
            >
              {userEmail}
            </span>
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  background: 'var(--primitive-yellow)',
                  color: 'var(--primitive-black)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  border: 'none',
                }}
              >
                Painel Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-text-inverse-muted)',
                color: 'var(--color-text-inverse-muted)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* CONTEÚDO */}
      {/* ============================================ */}
      <main
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '40px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          {/* Esquerda: Título + Subtítulo */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 4px 0',
              }}
            >
              Minhas Consultas
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Histórico de todas as suas consultas.
            </p>
          </div>

          {/* Direita: Botão Nova Consulta */}
          <button
            type="button"
            onClick={handleNovaConsulta}
            style={{
              background: 'var(--primitive-yellow)',
              color: 'var(--primitive-black)',
              fontFamily: 'var(--font-family-body)',
              fontSize: '13px',
              fontWeight: 700,
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Nova Consulta
          </button>
        </div>

        {/* Lista de Cards */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {purchases.length === 0 ? (
            <div
              style={{
                background: 'var(--primitive-white)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '6px',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}
              >
                Você ainda não tem consultas. Faça sua primeira consulta!
              </p>
            </div>
          ) : (
            purchases.map((purchase) => (
              <CardConsulta key={purchase.id} purchase={purchase} onViewReport={handleViewReport} />
            ))
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <Footer />
    </div>
  );
}
