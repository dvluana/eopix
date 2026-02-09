"use client"

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';

function ConfirmacaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseCode = searchParams.get('code') || '';
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [isSavingEmail, setIsSavingEmail] = React.useState(false);
  // Buscar dados da compra ao carregar
  React.useEffect(() => {
    const fetchPurchase = async () => {
      if (!purchaseCode) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/purchases/${purchaseCode}`);
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error('Erro ao buscar compra:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchase();
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
      setEmailError('E-mail não pode estar vazio');
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError('E-mail inválido');
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

      setEmail(data.email || newEmail);
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

  // Se não tiver código, mostrar erro
  if (!purchaseCode) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '24px', marginBottom: '16px' }}>
            Código de compra não encontrado
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

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-family-body)', fontSize: '16px', color: 'var(--color-text-secondary)' }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* NAV */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT - Card Centralizado */}
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
          {/* CARD DE CONFIRMAÇÃO */}
          <div style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--primitive-radius-md)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: 'var(--primitive-space-10)',
            textAlign: 'center'
          }}>
            {/* 1. ÍCONE DE CHECK */}
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="5,12 10,17 19,8"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* 2. TÍTULO */}
            <h1 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 'var(--primitive-weight-bold)',
              color: 'var(--color-text-primary)',
              marginTop: 'var(--primitive-space-4)',
              marginBottom: 0
            }}>
              Pedido realizado!
            </h1>

            {/* 3. BLOCO E-MAIL EM DESTAQUE */}
            <div style={{
              marginTop: 'var(--primitive-space-6)',
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
                {email}
              </div>

              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--primitive-space-1)'
              }}>
                Está correto?
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
                  {/* Label */}
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-body)',
                    fontSize: 'var(--primitive-size-caption)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--primitive-space-2)'
                  }}>
                    Novo e-mail:
                  </label>

                  {/* Container do Input + Botão + X */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    gap: 'var(--primitive-space-2)',
                    alignItems: 'flex-start'
                  }}>
                    {/* Input com botão interno */}
                    <div style={{
                      position: 'relative',
                      flex: 1
                    }}>
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

                      {/* Botão Salvar dentro do input */}
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
                        onMouseEnter={(e) => !isSavingEmail && (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => !isSavingEmail && (e.currentTarget.style.opacity = '1')}
                      >
                        {isSavingEmail ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>

                    {/* Botão X (Cancelar) */}
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
                        transition: 'var(--transition-fast)',
                        marginTop: '2px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Erro inline */}
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

                  {/* Microtexto */}
                  <p style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: 'var(--primitive-size-caption)',
                    color: 'var(--color-text-secondary)',
                    marginTop: 'var(--primitive-space-2)',
                    marginBottom: 0,
                    lineHeight: 1.5
                  }}>
                    O e-mail será atualizado e as notificações serão reenviadas.
                  </p>
                </div>
              )}
            </div>

            {/* 4. CÓDIGO DA COMPRA */}
            <div style={{
              marginTop: 'var(--primitive-space-5)',
              fontFamily: 'var(--font-family-body)'
            }}>
              <span style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)'
              }}>
                Seu código:{' '}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 'var(--primitive-weight-bold)',
                color: 'var(--color-text-primary)'
              }}>
                #{purchaseCode}
              </span>
            </div>

            {/* 5. CALLOUT INFORMATIVO */}
            <div style={{
              marginTop: 'var(--primitive-space-6)',
              background: 'var(--color-bg-secondary)',
              borderLeft: '3px solid var(--color-border-accent)',
              borderRadius: '0 var(--primitive-radius-md) var(--primitive-radius-md) 0',
              padding: 'var(--primitive-space-4)',
              textAlign: 'left'
            }}>
              <p style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
                lineHeight: 1.6,
                marginBottom: 'var(--primitive-space-2)'
              }}>
                Seu pedido foi registrado. Em alguns minutos seu relatório estará pronto.
              </p>
              <p style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.6,
                margin: 0
              }}>
                Você receberá um e-mail quando estiver pronto.
              </p>
            </div>

            {/* 6. CALLOUT SPAM */}
            <div style={{
              marginTop: 'var(--primitive-space-3)',
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
                Não recebeu? Verifique o spam. Você também pode acessar{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  /minhas-consultas
                </strong>
                {' '}a qualquer momento.
              </p>
            </div>

            {/* 7. BOTÃO */}
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
              IR PARA MINHAS CONSULTAS
            </button>
          </div>
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
