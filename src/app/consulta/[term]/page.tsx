"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import MaintenanceCallout from '@/components/MaintenanceCallout';
import LeadCaptureForm from '@/components/LeadCaptureForm';

interface PageProps {
  params: { term: string }
}

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');

  // Detecta se está em modo manutenção via query param
  const isMaintenance = searchParams?.get('variant') === 'maintenance';

  // ============================================
  // DETECTA SE É CPF (11 dígitos) OU CNPJ (14 dígitos)
  // ============================================
  const getDocumentType = (value: string | undefined): 'CPF' | 'CNPJ' | 'DOCUMENTO' => {
    if (!value) return 'DOCUMENTO';

    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return 'CPF'; // 11 dígitos = CPF
    } else if (cleaned.length === 14) {
      return 'CNPJ'; // 14 dígitos = CNPJ
    }

    return 'DOCUMENTO'; // Fallback caso não seja nem CPF nem CNPJ
  };

  // Função para mascarar CPF/CNPJ
  const maskTerm = (value: string | undefined): string => {
    if (!value) return '***.***.***-**';

    // Remove caracteres especiais
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 11) {
      // CPF: ***.456.789-**
      return `***.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-**`;
    } else if (cleaned.length === 14) {
      // CNPJ: **.***.***/****-**
      return `**.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-**`;
    }

    // Fallback: mostra só parte do meio
    const middle = cleaned.substring(3, 6);
    return `***.${middle}.***-**`;
  };

  // CPF/CNPJ mascarado vindo da rota
  const maskedTerm = maskTerm(params.term);
  // Tipo do documento detectado automaticamente (CPF ou CNPJ)
  const documentType = getDocumentType(params.term);

  const [isLoading, setIsLoading] = React.useState(false);

  const handlePurchase = async () => {
    if (!email) {
      alert('Por favor, informe seu e-mail');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: params.term,
          email,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao criar compra');
        return;
      }

      // Redireciona para checkout ou confirmação
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/compra/confirmacao?code=${data.code}`);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Erro ao processar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cards com blur
  const blurredCards: Array<{ title: string; content: string; icon: string; risk: 'high' | 'medium' | 'low' | null }> = [
    {
      title: 'Cadastro Empresarial',
      content: 'Situação: ████ | Abertura: ██/██/████ | Sócios: █ encontrados',
      icon: '🏢',
      risk: null // Primeiro card SEM blur
    },
    {
      title: 'Situação Financeira',
      content: 'Protestos: ██ | Valor: R$ █.███,██ | Dívidas: ██',
      icon: '💰',
      risk: 'high' // 🔴 Alto risco
    },
    {
      title: 'Processos Judiciais',
      content: '██ processos encontrados | Tribunais: ██ | Polo réu: ██',
      icon: '⚖️',
      risk: 'high' // 🔴 Alto risco
    },
    {
      title: 'Notícias e Web',
      content: '██ menções encontradas | Última: ██/██/███',
      icon: '📰',
      risk: 'medium' // 🟡 Médio risco
    },
    {
      title: 'Reclame Aqui',
      content: '██ reclamações | ██ respondidas | Nota: █,█',
      icon: '⭐',
      risk: 'medium' // 🟡 Médio risco
    },
    {
      title: 'Resumo por IA',
      content: 'Com base nos dados coletados, identificamos que ████████████████',
      icon: '🤖',
      risk: null // Resumo não tem risco
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
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>
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

          {/*
            Mostra "CPF consultado:" ou "CNPJ consultado:" dependendo do tipo detectado
            - CPF = 11 dígitos (ex: 123.456.789-10)
            - CNPJ = 14 dígitos (ex: 12.345.678/0001-90)
          */}
          <p className="caption text-muted" style={{ marginBottom: 'var(--primitive-space-8)', fontStyle: 'italic' }}>
            {isMaintenance
              ? `Não foi possível processar a consulta para ${maskedTerm}`
              : `${documentType} consultado: ${maskedTerm}`
            }
          </p>

          {/* Callout de manutenção - apenas em modo manutenção */}
          {isMaintenance && <MaintenanceCallout />}

          {/* Lead capture form - apenas em modo manutenção */}
          {isMaintenance && <LeadCaptureForm />}

          {/* Form com input de email e botão - necessário para ativar autoComplete do navegador */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handlePurchase();
          }}>
            {/* Input de email - seguindo Design System */}
            <div style={{ marginBottom: 'var(--primitive-space-4)', textAlign: 'left' }}>
              <label
                htmlFor="email"
                className="caption text-muted"
                style={{ display: 'block', marginBottom: 'var(--primitive-space-2)' }}
              >
                Para onde enviamos o relatório?
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onClick={() => {
                  if (!email) {
                    setEmail('exemplo@email.com');
                  }
                }}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '2px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--primitive-size-body)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-accent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border-default)';
                }}
              />
            </div>

            {/* Botão de compra */}
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
              <span style={{ fontSize: '14px' }}>📧</span>
              <span>Por email</span>
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

          {/* Faixa amarela centralizada */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(26, 26, 26, 0.85)',
            color: 'var(--color-text-accent)',
            padding: '6px 16px',
            borderRadius: 'var(--primitive-radius-sm)',
            zIndex: 10,
            fontFamily: 'var(--font-family-body)',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            Exemplo de dados que serão desbloqueados
          </div>

          {/* Grid 2x3 de cards com blur */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {blurredCards.map((card, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '6px',
                  padding: '20px'
                }}
              >
                {/* Título legível (sem blur) */}
                <h3 style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '12px'
                }}>
                  {card.title}
                </h3>

                {/* Conteúdo placeholder com blur pesado */}
                <p style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  margin: 0,
                  filter: card.risk ? 'blur(8px)' : 'none',
                  userSelect: 'none',
                  lineHeight: 1.6
                }}>
                  {card.content}
                </p>

                {/* Ícone e badge de risco */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '8px'
                }}>
                  <span style={{
                    fontSize: '16px',
                    marginRight: '4px'
                  }}>
                    {card.icon}
                  </span>
                  {getRiskBadge(card.risk)}
                </div>
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
            onClick={handlePurchase}
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
            Pagamento 100% seguro • Relatório enviado por email em até 3 minutos
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
    </div>
  );
}
