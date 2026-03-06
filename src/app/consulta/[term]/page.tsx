"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import MaintenanceCallout from '@/components/MaintenanceCallout';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { formatDocument } from '@/lib/validators';

interface PageProps {
  params: { term: string }
}

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detecta se está em modo manutenção via query param
  const isMaintenance = searchParams?.get('variant') === 'maintenance';

  // Tipo do documento detectado automaticamente (CPF ou CNPJ)
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
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null); // null = checking
  const [userEmail, setUserEmail] = React.useState('');
  const [authMode, setAuthMode] = React.useState<'register' | 'login'>('register');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [authError, setAuthError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [cellphone, setCellphone] = React.useState('');
  const [buyerTaxId, setBuyerTaxId] = React.useState('');

  // Mask: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Mask: CPF (XXX.XXX.XXX-XX) or CNPJ (XX.XXX.XXX/XXXX-XX)
  const formatTaxId = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

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

  const createPurchase = async () => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term: params.term,
        termsAccepted: true,
        cellphone: cellphone.replace(/\D/g, ''),
        buyerTaxId: buyerTaxId.replace(/\D/g, ''),
        name,
        email,
      }),
    });

    const data = await res.json();

    if (res.status === 409 && data.existingReportId) {
      router.push(`/relatorio/${data.existingReportId}`);
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao criar compra');
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
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

  const handleRegisterAndPurchase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');

    if (authMode === 'register') {
      if (!name || name.length < 2) {
        setAuthError('Nome deve ter pelo menos 2 caracteres');
        return;
      }
      if (password.length < 8) {
        setAuthError('Senha deve ter pelo menos 8 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('As senhas nao coincidem');
        return;
      }
    }

    if (!email) {
      setAuthError('E-mail obrigatorio');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register or Login
      const authEndpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const authBody = authMode === 'register'
        ? { name, email, password }
        : { email, password };

      const authRes = await fetch(authEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authBody),
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        setAuthError(authData.error || 'Erro ao processar');
        return;
      }

      // Step 2: Create purchase (now authenticated)
      await createPurchase();
    } catch (err) {
      console.error('Purchase error:', err);
      setAuthError(err instanceof Error ? err.message : 'Erro ao processar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cards com blur - todos têm blur para criar efeito de "conteúdo bloqueado"
  const blurredCards: Array<{ title: string; content: string; icon: string; risk: 'high' | 'medium' | 'low' | null; blurred: boolean }> = [
    {
      title: 'Cadastro Empresarial',
      content: 'Situação: ████ | Abertura: ██/██/████ | Sócios: █ encontrados',
      icon: '🏢',
      risk: null,
      blurred: true
    },
    {
      title: 'Situação Financeira',
      content: 'Protestos: ██ | Valor: R$ █.███,██ | Dívidas: ██',
      icon: '💰',
      risk: 'high',
      blurred: true
    },
    {
      title: 'Processos Judiciais',
      content: '██ processos encontrados | Tribunais: ██ | Polo réu: ██',
      icon: '⚖️',
      risk: 'high',
      blurred: true
    },
    {
      title: 'Notícias e Web',
      content: '██ menções encontradas | Última: ██/██/███',
      icon: '📰',
      risk: 'medium',
      blurred: true
    },
    {
      title: 'Reclame Aqui',
      content: '██ reclamações | ██ respondidas | Nota: █,█',
      icon: '⭐',
      risk: 'medium',
      blurred: true
    },
    {
      title: 'Resumo por IA',
      content: 'Com base nos dados coletados, identificamos que ████████████████',
      icon: '🤖',
      risk: null,
      blurred: true
    }
  ];

  // Função auxiliar para renderizar badge de risco
  const getRiskBadge = (risk: 'high' | 'medium' | 'low' | null) => {
    if (!risk) return null;

    const badges = {
      high: { emoji: '🔴', label: 'Alto Risco', color: '#CC3333' },
      medium: { emoji: '🟡', label: 'Atenção', color: '#E8A500' },
      low: { emoji: '🟢', label: 'OK', color: '#2D9F4E' }
    };

    const badge = badges[risk];

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '10px',
        fontWeight: 700,
        color: badge.color,
        fontFamily: 'var(--font-family-body)',
        marginLeft: '8px'
      }}>
        <span>{badge.emoji}</span>
        <span>{badge.label}</span>
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* NAV */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner" style={{ justifyContent: 'space-between' }}>
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>
          {userEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-inverse-muted)',
              }}>
                {userEmail}
              </span>
              <Link
                href="/minhas-consultas"
                style={{
                  border: '1px solid var(--color-text-inverse-muted)',
                  color: 'var(--color-text-inverse-muted)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                Minhas Consultas
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ paddingTop: 'calc(64px + var(--primitive-space-10))', paddingBottom: 'var(--primitive-space-12)' }}>

        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <section style={{
          maxWidth: '640px',
          margin: '0 auto var(--primitive-space-12)',
          padding: '0 var(--primitive-space-6)',
          textAlign: 'center'
        }}>
          <div
            className="section-header__tag"
            style={{
              marginBottom: 'var(--primitive-space-6)',
              background: isMaintenance ? '#CC3333' : undefined,
              color: isMaintenance ? '#FFFFFF' : undefined
            }}
          >
            {isMaintenance ? 'SISTEMA EM MANUTENÇÃO' : 'RELATÓRIO PRONTO'}
          </div>

          <h1 className="display-xl" style={{ marginBottom: 'var(--primitive-space-4)' }}>
            {isMaintenance
              ? 'Sistema temporariamente indisponível'
              : <>Encontramos <span className="section-header__highlight">6 fontes</span> sobre este {documentType}</>
            }
          </h1>

          <p className="caption text-muted" style={{ marginBottom: 'var(--primitive-space-8)', fontStyle: 'italic' }}>
            {isMaintenance
              ? `Não foi possível processar a consulta para ${formattedTerm}`
              : `${documentType} consultado: ${formattedTerm}`
            }
          </p>

          {/* Callout de manutenção - apenas em modo manutenção */}
          {isMaintenance && <MaintenanceCallout />}

          {/* Lead capture form - apenas em modo manutenção */}
          {isMaintenance && <LeadCaptureForm />}

          {/* Auth + Purchase Form */}
          {isLoggedIn === null ? (
            /* Still checking session */
            <div style={{ padding: '20px 0' }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid var(--color-border-subtle)',
                borderTopColor: 'var(--primitive-yellow)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }} />
            </div>
          ) : isLoggedIn ? (
            /* Logged in: payment fields + purchase button */
            <form onSubmit={handlePurchaseLoggedIn} style={{ width: '100%' }}>
              <label htmlFor="cellphone-logged" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                Celular
              </label>
              <input
                id="cellphone-logged"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={cellphone}
                onChange={(e) => setCellphone(formatPhone(e.target.value))}
                disabled={isMaintenance}
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  marginBottom: 'var(--primitive-space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label htmlFor="buyerTaxId-logged" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                Seu CPF ou CNPJ
              </label>
              <input
                id="buyerTaxId-logged"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(formatTaxId(e.target.value))}
                disabled={isMaintenance}
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  marginBottom: 'var(--primitive-space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <button
                type="submit"
                disabled={isMaintenance || isLoading}
                className="btn btn--primary btn--lg"
                style={{
                  width: '100%',
                  fontSize: '18px',
                  padding: '18px 32px',
                  marginBottom: 'var(--primitive-space-3)',
                  opacity: (isMaintenance || isLoading) ? 0.5 : 1,
                  cursor: (isMaintenance || isLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Processando...' : isMaintenance ? 'Indisponível' : 'DESBLOQUEAR RELATÓRIO · R$ 29,90'}
              </button>
            </form>
          ) : (
            /* Not logged in: registration/login form + purchase */
            <form onSubmit={handleRegisterAndPurchase} style={{ width: '100%' }}>
              {authError && (
                <div style={{
                  color: '#CC3333',
                  fontSize: '13px',
                  marginBottom: 'var(--primitive-space-3)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-body)',
                }}>
                  {authError}
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <label htmlFor="name" className="caption" style={{
                    display: 'block', textAlign: 'left',
                    marginBottom: 'var(--primitive-space-1)',
                    color: 'var(--color-text-secondary)', fontWeight: 600,
                  }}>
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isMaintenance}
                    required
                    minLength={2}
                    style={{
                      width: '100%', padding: '14px 16px',
                      marginBottom: 'var(--primitive-space-3)',
                      background: 'var(--color-bg-subtle)',
                      border: '1px solid var(--color-border-default)',
                      borderRadius: 'var(--primitive-radius-md)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </>
              )}

              <label htmlFor="email" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isMaintenance}
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  marginBottom: 'var(--primitive-space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label htmlFor="password" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                Senha
              </label>
              <div style={{ position: 'relative', marginBottom: 'var(--primitive-space-3)' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={authMode === 'register' ? 'Minimo 8 caracteres' : 'Sua senha'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isMaintenance}
                  required
                  minLength={authMode === 'register' ? 8 : 1}
                  style={{
                    width: '100%', padding: '14px 16px', paddingRight: '44px',
                    background: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--primitive-radius-md)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--color-text-secondary)',
                    cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  )}
                </button>
              </div>

              {authMode === 'register' && (
                <>
                  <label htmlFor="confirmPassword" className="caption" style={{
                    display: 'block', textAlign: 'left',
                    marginBottom: 'var(--primitive-space-1)',
                    color: 'var(--color-text-secondary)', fontWeight: 600,
                  }}>
                    Confirmar Senha
                  </label>
                  <div style={{ position: 'relative', marginBottom: 'var(--primitive-space-3)' }}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isMaintenance}
                      required
                      minLength={8}
                      style={{
                        width: '100%', padding: '14px 16px', paddingRight: '44px',
                        background: 'var(--color-bg-subtle)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 'var(--primitive-radius-md)',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-text-secondary)',
                        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                      }}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      )}
                    </button>
                  </div>
                </>
              )}

              <label htmlFor="cellphone" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                Celular
              </label>
              <input
                id="cellphone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                value={cellphone}
                onChange={(e) => setCellphone(formatPhone(e.target.value))}
                disabled={isMaintenance}
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  marginBottom: 'var(--primitive-space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <label htmlFor="buyerTaxId" className="caption" style={{
                display: 'block', textAlign: 'left',
                marginBottom: 'var(--primitive-space-1)',
                color: 'var(--color-text-secondary)', fontWeight: 600,
              }}>
                Seu CPF ou CNPJ
              </label>
              <input
                id="buyerTaxId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(formatTaxId(e.target.value))}
                disabled={isMaintenance}
                required
                style={{
                  width: '100%', padding: '14px 16px',
                  marginBottom: 'var(--primitive-space-3)',
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                }}
              />

              <button
                type="submit"
                disabled={isMaintenance || isLoading}
                className="btn btn--primary btn--lg"
                style={{
                  width: '100%',
                  fontSize: '18px',
                  padding: '18px 32px',
                  marginBottom: 'var(--primitive-space-3)',
                  opacity: (isMaintenance || isLoading) ? 0.5 : 1,
                  cursor: (isMaintenance || isLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? 'Processando...' : isMaintenance ? 'Indisponível' : 'DESBLOQUEAR RELATÓRIO · R$ 29,90'}
              </button>

              {/* Toggle between register/login */}
              <p className="caption" style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--primitive-space-2)',
              }}>
                {authMode === 'register' ? (
                  <>
                    Ja possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--color-text-accent)',
                        textDecoration: 'underline', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 'inherit', padding: 0,
                      }}
                    >
                      Realize o login aqui
                    </button>
                  </>
                ) : (
                  <>
                    Nao possui conta?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--color-text-accent)',
                        textDecoration: 'underline', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 'inherit', padding: 0,
                      }}
                    >
                      Cadastre-se
                    </button>
                  </>
                )}
              </p>
            </form>
          )}

          {/* Aviso de termos */}
          <p className="caption text-muted" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
            Ao prosseguir com a compra, você aceita os{' '}
            <a
              href="#termos"
              style={{
                textDecoration: 'underline',
                color: 'var(--color-text-primary)'
              }}
            >
              Termos de Uso
            </a>
            {' '}e a{' '}
            <a
              href="#privacidade"
              style={{
                textDecoration: 'underline',
                color: 'var(--color-text-primary)'
              }}
            >
              Política de Privacidade
            </a>
          </p>

          {/* #4 TRUST BADGES - abaixo do botão */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--primitive-space-2)',
            marginTop: 'var(--primitive-space-5)',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--primitive-radius-full)',
              fontFamily: 'var(--font-family-body)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)'
            }}>
              <span style={{ fontSize: '14px' }}>🔒</span>
              <span>Pagamento seguro</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-accent)',
              borderRadius: 'var(--primitive-radius-full)',
              fontFamily: 'var(--font-family-body)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)'
            }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span>Instantâneo</span>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* PREVIEW DOS DADOS (Grid 2x3 com blur) */}
        {/* ============================================ */}
        <section style={{
          maxWidth: '800px',
          margin: '0 auto var(--primitive-space-12)',
          padding: '0 var(--primitive-space-6)',
          position: 'relative'
        }}>
          {/* Título da seção */}
          <h2 className="display-lg" style={{
            marginBottom: 'var(--primitive-space-8)',
            textAlign: 'center'
          }}>
            Veja o que <span className="section-header__highlight">encontramos</span>
          </h2>

          {/* Faixa de aviso centralizada - destacada */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: 'var(--color-text-accent)',
            padding: '10px 20px',
            borderRadius: 'var(--primitive-radius-md)',
            border: '1px solid var(--color-border-accent)',
            zIndex: 10,
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}>
            🔒 Exemplo de dados que serão desbloqueados
          </div>

          {/* Grid 2x3 de cards com blur */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {blurredCards.map((card, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  padding: '16px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                }}
              >
                {/* Header: ícone + título + cadeado */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '18px' }}>{card.icon}</span>
                  <h3 style={{
                    fontFamily: 'var(--font-family-heading)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    flex: 1
                  }}>
                    {card.title}
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    opacity: 0.5
                  }}>🔒</span>
                </div>

                {/* Conteúdo placeholder com blur */}
                <p style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                  margin: 0,
                  filter: card.blurred ? 'blur(6px)' : 'none',
                  userSelect: 'none',
                  lineHeight: 1.5
                }}>
                  {card.content}
                </p>

                {/* Badge de risco (se houver) */}
                {card.risk && (
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border-subtle)'
                  }}>
                    {getRiskBadge(card.risk)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* #1 SEÇÃO "POR QUE R$ 29,90?" - apenas no default */}
        {/* ============================================ */}
        {!isMaintenance && <section style={{
          maxWidth: '640px',
          margin: '0 auto var(--primitive-space-12)',
          padding: '0 var(--primitive-space-6)',
          textAlign: 'center'
        }}>
          {/* Título da seção */}
          <h2 className="display-lg" style={{ marginBottom: 'var(--primitive-space-6)' }}>
            Por que <span className="section-header__highlight">R$ 29,90</span> é justo?
          </h2>

          <div className="card card--accent-top" style={{ textAlign: 'left' }}>
            <h3 className="body font-bold" style={{ marginBottom: 'var(--primitive-space-5)', textAlign: 'center' }}>
              O que você recebe por R$ 29,90
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primitive-space-3)' }}>
              {/* Checkmark 1 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-3)' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                  <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="caption">Relatório completo em até 3 minutos</span>
              </div>

              {/* Checkmark 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-3)' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                  <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="caption">6 bases públicas cruzadas por IA</span>
              </div>

              {/* Checkmark 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-3)' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                  <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="caption">Dados da Receita Federal + Tribunais</span>
              </div>

              {/* Checkmark 4 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-3)' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                  <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="caption">Reclame Aqui + Notícias agregadas</span>
              </div>

              {/* Checkmark 5 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-3)' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
                  <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="caption">Resumo inteligente gerado por IA</span>
              </div>
            </div>

            {/* #5 BOX DE COMPARAÇÃO - dentro do card */}
            <div style={{
              marginTop: 'var(--primitive-space-5)',
              paddingTop: 'var(--primitive-space-5)',
              borderTop: '1px solid var(--color-border-subtle)'
            }}>
              <div style={{
                background: 'var(--color-bg-inverse)',
                border: '2px solid var(--color-border-default)',
                borderRadius: 'var(--primitive-radius-md)',
                padding: 'var(--primitive-space-5)',
                textAlign: 'center'
              }}>
                <p className="caption" style={{
                  color: 'var(--color-text-inverse)',
                  fontWeight: 700,
                  marginBottom: 'var(--primitive-space-3)',
                  letterSpacing: '0.5px'
                }}>
                  💰 ECONOMIA BRUTAL
                </p>
                <p className="body" style={{
                  color: 'var(--color-text-inverse)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--primitive-space-2)'
                }}>
                  <strong style={{
                    color: 'var(--color-text-accent)',
                    fontSize: '20px',
                    fontFamily: 'var(--font-family-heading)'
                  }}>
                    R$ 29,90
                  </strong>
                  {' '}
                  <span style={{ color: 'var(--color-text-inverse-muted)' }}>
                    (você)
                  </span>
                  {' vs '}
                  <strong style={{
                    color: 'var(--color-text-danger)',
                    fontSize: '20px',
                    fontFamily: 'var(--font-family-heading)'
                  }}>
                    R$ 500/mês
                  </strong>
                </p>
                <p className="caption" style={{
                  color: 'var(--color-text-inverse-subtle)',
                  fontStyle: 'italic',
                  lineHeight: 1.5
                }}>
                  Serasa Experian · Consulta avulsa · Sem mensalidade · Sem fidelidade
                </p>
              </div>
            </div>
          </div>
        </section>}

        {/* ============================================ */}
        {/* #3 CTA DUPLICADO - apenas no default */}
        {/* ============================================ */}
        {!isMaintenance && <section style={{
          maxWidth: '640px',
          margin: '0 auto var(--primitive-space-12)',
          padding: '0 var(--primitive-space-6)',
          textAlign: 'center'
        }}>
          <div className="callout callout--info" style={{ marginBottom: 'var(--primitive-space-5)' }}>
            <p className="callout__body">
              ⏱️ Não perca tempo. Os dados já estão prontos e esperando por você.
            </p>
          </div>

          <button
            onClick={() => {
              if (isLoggedIn) {
                handlePurchaseLoggedIn();
              } else {
                // Scroll to the auth form
                const firstField = document.getElementById(authMode === 'register' ? 'name' : 'email');
                firstField?.focus();
                firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            disabled={isLoading}
            className="btn btn--primary btn--lg"
            style={{
              width: '100%',
              fontSize: '18px',
              padding: '18px 32px',
              opacity: isLoading ? 0.5 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Processando...' : 'DESBLOQUEAR AGORA POR R$ 29,90'}
          </button>

          <p className="caption text-muted" style={{ marginTop: 'var(--primitive-space-3)', fontStyle: 'italic' }}>
            Pagamento 100% seguro • Relatório disponível em até 3 minutos
          </p>
        </section>}

        {/* Footer note */}
        <div style={{
          maxWidth: '840px',
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 var(--primitive-space-6)'
        }}>
          <p className="caption text-muted" style={{ fontStyle: 'italic' }}>
            Organizamos informações públicas. Não garantimos veracidade. Não fazemos juízo de valor.
            Decisão e responsabilidade são sempre do usuário.
          </p>
        </div>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="footer" role="contentinfo">
        <div className="footer__inner">
          <div className="footer__brand">
            <LogoFundoPreto />
          </div>
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
          <p className="footer__copy">
            © 2026 E o Pix? — Todos os direitos reservados.
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
