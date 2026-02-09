"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

// ============================================
// TIPOS
// ============================================
type PurchaseStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'REFUND_PENDING' | 'EXPIRED' | 'PENDING' | 'PAID';
type LoginStep = 'email' | 'codigo';

interface Purchase {
  id: string;
  code: string;
  status: PurchaseStatus;
  processingStep?: number;
  term: string;
  type: 'CPF' | 'CNPJ';
  createdAt: string;
  hasReport: boolean;
  reportId?: string;
}

// Etapas de processamento
const PROCESSING_STEPS = [
  { step: 1, label: 'Dados cadastrais' },
  { step: 2, label: 'Dados financeiros' },
  { step: 3, label: 'Processos judiciais' },
  { step: 4, label: 'Menções na web' },
  { step: 5, label: 'Gerando resumo' },
  { step: 6, label: 'Finalizando' },
];

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

  const getBadgeConfig = (status: PurchaseStatus) => {
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
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {currentStepInfo ? currentStepInfo.label : 'Iniciando...'}
            </span>
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
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState('');
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Estados do Login
  const [step, setStep] = React.useState<LoginStep>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Fetch purchases when authenticated
  const fetchPurchases = React.useCallback(async () => {
    try {
      const res = await fetch('/api/purchases');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Erro ao carregar consultas');
      }
      const data = await res.json();
      setPurchases(data.purchases || []);
      if (data.email) {
        setUserEmail(data.email);
      }
    } catch (err) {
      console.error('Erro ao carregar consultas:', err);
    }
  }, []);

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
        }
      } catch {
        // Not authenticated
      }
    };
    checkSession();
  }, []);

  // Polling para atualizar progresso quando há purchases em processamento
  React.useEffect(() => {
    if (!isAuthenticated) return;

    const hasProcessing = purchases.some(
      p => p.status === 'PROCESSING' || p.status === 'PAID'
    );

    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/purchases');
        if (res.ok) {
          const data = await res.json();
          setPurchases(data.purchases || []);
        }
      } catch {
        // Ignore errors during polling
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, purchases]);

  // ============================================
  // ESTADO 1: ENVIAR CÓDIGO
  // ============================================
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor, informe seu e-mail');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar código');
        return;
      }

      // Avança para o estado de código
      setStep('codigo');
    } catch {
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // ESTADO 2: VERIFICAR CÓDIGO
  // ============================================
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor, digite o código completo');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Código inválido');
        return;
      }

      // Autenticação bem sucedida
      setUserEmail(email);
      setIsAuthenticated(true);
      await fetchPurchases();
    } catch {
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // LÓGICA DOS 6 INPUTS DE CÓDIGO
  // ============================================
  const handleCodeChange = (index: number, value: string) => {
    // Aceita apenas números
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length > 1) {
      return; // Não aceita mais de 1 dígito
    }

    const newCode = [...code];
    newCode[index] = numericValue;
    setCode(newCode);

    // Auto-focus no próximo input
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace: volta para o input anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);

    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus(); // Foca no último input
    }
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
    setStep('email');
    setEmail('');
    setCode(['', '', '', '', '', '']);
  };

  const handleNovaConsulta = () => {
    router.push('/');
  };

  const handleViewReport = (id: string) => {
    router.push(`/relatorio/${id}`);
  };

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

          {/* ============================================ */}
          {/* CARD CENTRALIZADO */}
          {/* ============================================ */}
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

            {/* ============================================ */}
            {/* ESTADO 1: EMAIL */}
            {/* ============================================ */}
            {step === 'email' && (
              <>
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
                  Digite seu e-mail para acessar suas consultas.
                </p>

                <form onSubmit={handleSendCode}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoFocus
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid var(--primitive-black)',
                      borderRadius: 'var(--primitive-radius-md)',
                      background: 'var(--primitive-white)',
                      color: 'var(--primitive-black)',
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      outline: 'none',
                      marginBottom: '16px'
                    }}
                  />

                  {error && (
                    <div style={{
                      color: '#CC3333',
                      fontSize: '13px',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn--primary btn--lg"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '14px',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar código'}
                  </button>
                </form>
              </>
            )}

            {/* ============================================ */}
            {/* ESTADO 2: CÓDIGO */}
            {/* ============================================ */}
            {step === 'codigo' && (
              <>
                <h1 style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--primitive-black)',
                  textAlign: 'center',
                  margin: '0 0 8px 0'
                }}>
                  Código enviado!
                </h1>

                <p style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  margin: '0 0 24px 0'
                }}>
                  Enviamos um código de 6 dígitos para <strong>{email}</strong>
                </p>

                <form onSubmit={handleVerifyCode}>
                  {/* 6 caixinhas de código */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center',
                    marginBottom: '24px'
                  }}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        onPaste={index === 0 ? handleCodePaste : undefined}
                        autoFocus={index === 0}
                        disabled={isLoading}
                        style={{
                          width: '48px',
                          height: '56px',
                          border: '2px solid var(--primitive-black)',
                          borderRadius: 'var(--primitive-radius-md)',
                          background: 'var(--primitive-white)',
                          color: 'var(--primitive-black)',
                          fontFamily: 'var(--font-family-body)',
                          fontSize: '24px',
                          fontWeight: 700,
                          textAlign: 'center',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>

                  {error && (
                    <div style={{
                      color: '#CC3333',
                      fontSize: '13px',
                      marginBottom: '12px',
                      textAlign: 'center'
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn--primary btn--lg"
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '14px',
                      marginBottom: '20px',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    {isLoading ? 'Verificando...' : 'Entrar'}
                  </button>
                </form>

                {/* Callout spam */}
                <div style={{
                  background: 'var(--color-bg-primary)',
                  borderLeft: '3px solid var(--primitive-yellow)',
                  borderRadius: '0 6px 6px 0',
                  padding: '12px 16px',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '13px',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                  }}>
                    Não recebeu o código? Verifique o spam.
                  </p>
                </div>

                {/* Link voltar */}
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '12px',
                      color: 'var(--color-text-tertiary)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Usar outro e-mail
                  </button>
                </div>
              </>
            )}
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
              © 2026 E o Pix? Todos os direitos reservados.
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
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          background: 'rgba(26, 26, 26, 0.97)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
          }}
        >
          <LogoFundoPreto />
        </Link>

        {/* User + Logout */}
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
