"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

// ============================================
// TIPOS
// ============================================
type PurchaseStatus = 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'REFUND_PENDING' | 'EXPIRED';
type LoginStep = 'email' | 'codigo';

interface Purchase {
  id: string;
  status: PurchaseStatus;
  searchTerm: string;
  createdAt: string;
  processedMessage?: string;
}

// ============================================
// DADOS MOCK
// ============================================
const mockPurchases: Purchase[] = [
  {
    id: '1',
    status: 'COMPLETED',
    searchTerm: '***.456.789-**',
    createdAt: '05/02/2026 às 14:32',
  },
  {
    id: '2',
    status: 'PROCESSING',
    searchTerm: '12.345.678/0001-**',
    createdAt: 'Iniciado há 2 minutos',
  },
  {
    id: '3',
    status: 'FAILED',
    searchTerm: '***.789.012-**',
    createdAt: 'Reembolso automático processado',
  },
  {
    id: '4',
    status: 'REFUND_PENDING',
    searchTerm: '***.321.654-**',
    createdAt: 'Estamos resolvendo. Entraremos em contato.',
  },
  {
    id: '5',
    status: 'EXPIRED',
    searchTerm: '98.765.432/0001-**',
    createdAt: 'Relatório expirado em 28/01/2026',
  },
];

// ============================================
// CARD DE CONSULTA
// ============================================
interface CardConsultaProps {
  purchase: Purchase;
  onViewReport: (id: string) => void;
}

function CardConsulta({ purchase, onViewReport }: CardConsultaProps) {
  const getBadgeConfig = (status: PurchaseStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: '✅ CONCLUÍDO',
          bg: 'rgba(102, 204, 102, 0.15)',
          color: '#339933',
        };
      case 'PROCESSING':
        return {
          label: '⏳ PROCESSANDO',
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
    }
  };

  const badge = getBadgeConfig(purchase.status);
  const documentType = purchase.searchTerm.includes('/') ? 'CNPJ' : 'CPF';

  return (
    <div
      style={{
        background: 'var(--primitive-white)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        padding: '20px 24px',
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
          {documentType}: {purchase.searchTerm}
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
          {purchase.createdAt}
        </div>
      </div>

      {/* Lado direito */}
      <div>
        {purchase.status === 'COMPLETED' && (
          <button
            type="button"
            onClick={() => onViewReport(purchase.id)}
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

        {purchase.status === 'PROCESSING' && (
          <div
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            Aguarde...
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
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function Page() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false); // TODO: pegar da session real
  const userEmail = 'joao.silva@gmail.com'; // TODO: pegar da session

  // Estados do Login
  const [step, setStep] = React.useState<LoginStep>('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // ============================================
  // ESTADO 1: ENVIAR CÓDIGO
  // ============================================
  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert('Por favor, informe seu e-mail');
      return;
    }

    // TODO: POST /api/auth/send-code { email }
    console.log('Enviando código para:', email);

    // Avança para o estado de código
    setStep('codigo');
  };

  // ============================================
  // ESTADO 2: VERIFICAR CÓDIGO
  // ============================================
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      alert('Por favor, digite o código completo');
      return;
    }

    // TODO: POST /api/auth/verify-code { email, code }
    // TODO: Criar session JWT após verificação
    console.log('Verificando código:', fullCode, 'para email:', email);

    // Simula autenticação
    setIsAuthenticated(true);
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

  const handleLogout = () => {
    // TODO: Implementar logout real
    setIsAuthenticated(false);
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
                    onClick={() => {
                      if (!email) {
                        setEmail('exemplo@email.com');
                      }
                    }}
                    placeholder="seu@email.com"
                    autoFocus
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

                  <button
                    type="submit"
                    className="btn btn--primary btn--lg"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '14px'
                    }}
                  >
                    Enviar código
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
                        onClick={() => {
                          if (code.every(c => !c)) {
                            setCode(['4', '8', '2', '7', '1', '5']);
                            inputRefs.current[5]?.focus();
                          }
                        }}
                        autoFocus={index === 0}
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

                  <button
                    type="submit"
                    className="btn btn--primary btn--lg"
                    style={{
                      width: '100%',
                      padding: '16px',
                      fontSize: '14px',
                      marginBottom: '20px'
                    }}
                  >
                    Entrar
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
          {mockPurchases.map((purchase) => (
            <CardConsulta key={purchase.id} purchase={purchase} onViewReport={handleViewReport} />
          ))}
        </div>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <Footer />
    </div>
  );
}
