"use client"

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { X, Clock, CheckCircle, Loader2 } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';

type PageState =
  | 'loading'           // Carregando dados
  | 'not_found'         // Código inválido
  | 'pending_payment'   // Aguardando pagamento (boleto)
  | 'approved'          // Pagamento aprovado, gerando relatório
  | 'completed'         // Relatório pronto

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

  const [pageState, setPageState] = React.useState<PageState>('loading');
  const [purchaseData, setPurchaseData] = React.useState<PurchaseData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Estados para edição de email
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [isSavingEmail, setIsSavingEmail] = React.useState(false);

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

        // 2. Determinar estado baseado no status
        if (data.status === 'PENDING') {
          setPageState('pending_payment');
          return;
        }

        if (data.status === 'COMPLETED' || data.hasReport) {
          setPageState('completed');
        } else {
          setPageState('approved'); // PAID ou PROCESSING
        }

        // 3. Tentar auto-login (só se não for PENDING)
        try {
          const loginRes = await fetch('/api/auth/auto-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: purchaseCode }),
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            setIsLoggedIn(true);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
        }
      } catch (err) {
        console.error('Erro ao buscar compra:', err);
        setPageState('not_found');
      }
    };

    fetchAndProcess();
  }, [purchaseCode]);

  const handleCorrectEmailClick = () => {
    setIsEditingEmail(true);
    setNewEmail('');
    setEmailError('');
  };

  const handleCancelEdit = () => {
    setIsEditingEmail(false);
    setNewEmail('');
    setEmailError('');
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveEmail = async () => {
    if (!newEmail) {
      setEmailError('E-mail nao pode estar vazio');
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError('E-mail invalido');
      return;
    }

    setIsSavingEmail(true);
    setEmailError('');

    try {
      const res = await fetch(`/api/purchases/${purchaseCode}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error || 'Erro ao atualizar e-mail');
        return;
      }

      if (purchaseData) {
        setPurchaseData({ ...purchaseData, email: data.email || newEmail });
      }
      setIsEditingEmail(false);
      setNewEmail('');
    } catch {
      setEmailError('Erro ao atualizar e-mail. Tente novamente.');
    } finally {
      setIsSavingEmail(false);
    }
  };

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
      case 'pending_payment':
        return (
          <>
            {/* Ícone de Clock */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-bg-accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Clock size={24} color="var(--color-text-secondary)" />
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
              Aguardando pagamento
            </h1>

            {/* Descrição */}
            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--primitive-space-4)',
              lineHeight: 1.6
            }}>
              Seu boleto foi gerado com sucesso. Assim que o pagamento for confirmado, iniciaremos a geracao do seu relatorio.
            </p>

            {/* Email */}
            <div style={{
              marginTop: 'var(--primitive-space-5)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: 'var(--primitive-space-4)',
              textAlign: 'left'
            }}>
              <p style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                margin: 0
              }}>
                Voce recebera um e-mail em <strong style={{ color: 'var(--color-text-primary)' }}>{purchaseData?.email}</strong> quando o relatorio estiver pronto.
              </p>
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
              className="btn btn--secondary"
              style={{
                marginTop: 'var(--primitive-space-6)',
                width: '100%',
                fontSize: '14px',
                padding: '16px',
                fontWeight: 'var(--primitive-weight-bold)'
              }}
            >
              IR PARA MINHAS CONSULTAS
            </button>
          </>
        );

      case 'approved':
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
              Pagamento confirmado com sucesso. Estamos gerando seu relatorio...
            </p>

            {/* Progress indicator */}
            <div style={{
              marginTop: 'var(--primitive-space-5)',
              background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--primitive-radius-md)',
              padding: 'var(--primitive-space-4)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--primitive-space-3)'
              }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-text-accent)' }} />
                <span style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)'
                }}>
                  Buscando dados...
                </span>
              </div>
            </div>

            {/* Email Block */}
            {renderEmailBlock()}

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
              {isLoggedIn ? 'VER MEUS RELATORIOS' : 'IR PARA MINHAS CONSULTAS'}
            </button>
          </>
        );

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

  const renderEmailBlock = () => (
    <div style={{
      marginTop: 'var(--primitive-space-5)',
      fontFamily: 'var(--font-family-body)'
    }}>
      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        marginBottom: 'var(--primitive-space-2)'
      }}>
        Enviamos para
      </p>

      <div style={{
        display: 'inline-block',
        background: 'var(--color-bg-accent-light)',
        padding: '8px 12px',
        borderRadius: 'var(--primitive-radius-sm)',
        fontSize: '16px',
        fontWeight: 'var(--primitive-weight-bold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--primitive-space-2)'
      }}>
        {purchaseData?.email}
      </div>

      <p style={{
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
        marginBottom: 'var(--primitive-space-1)'
      }}>
        Esta correto?
      </p>

      <button
        onClick={handleCorrectEmailClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
      >
        Corrigir e-mail
      </button>

      {isEditingEmail && (
        <div style={{
          marginTop: 'var(--primitive-space-4)',
          textAlign: 'left'
        }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--primitive-size-caption)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--primitive-space-2)'
          }}>
            Novo e-mail:
          </label>

          <div style={{
            position: 'relative',
            display: 'flex',
            gap: 'var(--primitive-space-2)',
            alignItems: 'flex-start'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEmail();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                placeholder="seu.email@gmail.com"
                autoFocus
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--primitive-size-sm)',
                  padding: 'var(--primitive-space-3)',
                  paddingRight: '70px',
                  borderRadius: 'var(--primitive-radius-md)',
                  border: '2px solid var(--primitive-black)',
                  background: 'var(--color-bg-primary)',
                  outline: 'none'
                }}
              />

              <button
                onClick={handleSaveEmail}
                disabled={isSavingEmail}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--primitive-yellow)',
                  border: 'none',
                  borderRadius: 'var(--primitive-radius-sm)',
                  padding: '6px 12px',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  fontWeight: 'var(--primitive-weight-bold)',
                  color: 'var(--primitive-black)',
                  cursor: isSavingEmail ? 'not-allowed' : 'pointer',
                  opacity: isSavingEmail ? 0.7 : 1,
                  transition: 'var(--transition-fast)'
                }}
              >
                {isSavingEmail ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            <button
              onClick={handleCancelEdit}
              aria-label="Cancelar"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {emailError && (
            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: 'var(--primitive-size-caption)',
              color: 'var(--color-text-danger)',
              marginTop: 'var(--primitive-space-2)',
              marginBottom: 0
            }}>
              {emailError}
            </p>
          )}

          <p style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--primitive-size-caption)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--primitive-space-2)',
            marginBottom: 0,
            lineHeight: 1.5
          }}>
            O e-mail sera atualizado e as notificacoes serao reenviadas.
          </p>
        </div>
      )}
    </div>
  );

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
