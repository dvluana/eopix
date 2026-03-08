"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import { usePurchasePolling } from '@/lib/hooks/use-purchase-polling';
import type { Purchase } from '@/types/domain';
import ProcessingTracker from '@/components/ProcessingTracker';
import NovaConsultaModal from '@/components/NovaConsultaModal';

// ============================================
// CARD DE CONSULTA
// ============================================
interface CardConsultaProps {
  purchase: Purchase;
  onViewReport: (id: string) => void;
}

function CardConsulta({ purchase, onViewReport }: CardConsultaProps) {
  const isProcessing = purchase.status === 'PROCESSING' || purchase.status === 'PAID' || purchase.status === 'FAILED';
  const currentStep = purchase.processingStep || 0;

  const getStatusKey = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'PROCESSING': case 'PAID': case 'FAILED': return 'processing';
      case 'PENDING': return 'pending';
      case 'REFUND_PENDING': return 'failed';
      default: return 'pending';
    }
  };

  const getBadgeLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'CONCLUÍDO';
      case 'PROCESSING': case 'PAID': case 'FAILED': return 'PROCESSANDO';
      case 'PENDING': return 'AGUARDANDO PAGAMENTO';
      case 'REFUND_PENDING': return 'REEMBOLSO PENDENTE';
      case 'EXPIRED': return 'EXPIRADO';
      default: return status;
    }
  };

  const statusKey = getStatusKey(purchase.status);

  return (
    <div className={`mc-card mc-card--${statusKey}`}>
      <div className="mc-card__header">
        <div className="mc-card__left">
          <span className={`mc-card__badge mc-card__badge--${statusKey}`}>
            {getBadgeLabel(purchase.status)}
          </span>
          <div className="mc-card__doc">
            {purchase.type}: {purchase.term}
          </div>
          <div className="mc-card__date">
            {new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        <div>
          {purchase.status === 'COMPLETED' && purchase.hasReport && purchase.reportId && (
            <button
              type="button"
              onClick={() => onViewReport(purchase.reportId!)}
              className="btn btn--outline btn--sm"
            >
              Ver Relatório
            </button>
          )}
        </div>
      </div>

      {/* Processing progress */}
      {isProcessing && (
        <ProcessingTracker
          currentStep={currentStep}
          variant="compact"
          failed={purchase.status === 'FAILED'}
        />
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
  const [modalOpen, setModalOpen] = React.useState(false);

  // SSE + fallback polling for real-time updates
  usePurchasePolling({
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    }
    router.push('/');
  };

  const handleNovaConsulta = () => {
    setModalOpen(true);
  };

  const handleViewReport = (id: string) => {
    router.push(`/relatorio/${id}`);
  };

  // ============================================
  // LOADING: CHECKING SESSION
  // ============================================
  if (isAuthenticated === null) {
    return (
      <div className="mc-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="conf-spinner" style={{ width: '24px', height: '24px', border: '2px solid var(--primitive-gray-200)', borderTopColor: 'var(--primitive-yellow-500)', borderRadius: '50%' }} />
      </div>
    );
  }

  // ============================================
  // SE NÃO ESTIVER AUTENTICADO: REDIRECIONA PRA HOME
  // ============================================
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // ============================================
  // SE ESTIVER AUTENTICADO: MOSTRA LISTA DE CONSULTAS
  // ============================================
  return (
    <div className="mc-page mc-page--authed">
      <TopBar
        email={userEmail}
        isAdmin={isAdmin}
        showLogout
        onLogout={handleLogout}
      />

      <main className="mc-main">
        <div className="mc-header">
          <div className="mc-header__left">
            <span className="mc-header__badge">MEUS RELATÓRIOS</span>
            <h1 className="mc-header__title">Minhas Consultas</h1>
            <p className="mc-header__sub">Histórico de todas as suas consultas.</p>
          </div>
          <button type="button" onClick={handleNovaConsulta} className="btn btn--cta">
            Nova Consulta
          </button>
        </div>

        <div className="mc-list">
          {purchases.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty__icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
                  <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="16" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="16" y1="28" x2="24" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="mc-empty__text">Você ainda não tem consultas. Faça sua primeira consulta!</p>
              <button type="button" onClick={handleNovaConsulta} className="btn btn--cta">
                Nova Consulta
              </button>
            </div>
          ) : (
            purchases.map((purchase) => (
              <CardConsulta key={purchase.id} purchase={purchase} onViewReport={handleViewReport} />
            ))
          )}
        </div>
      </main>

      <Footer />

      <NovaConsultaModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
