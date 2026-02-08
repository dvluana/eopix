"use client"

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* NAV */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <a href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </a>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ paddingTop: 'calc(64px + var(--primitive-space-10))', paddingBottom: 'var(--primitive-space-12)' }}>

        {/* ============================================ */}
        {/* HERO SECTION */}
        {/* ============================================ */}
        <section style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 var(--primitive-space-6)',
          textAlign: 'center',
          minHeight: 'calc(100vh - 64px - var(--primitive-space-10) - var(--primitive-space-12))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            margin: '0 auto var(--primitive-space-6)',
            background: '#CC3333',
            color: 'var(--primitive-white)',
            padding: '8px 16px',
            borderRadius: 'var(--primitive-radius-sm)',
            fontFamily: 'var(--font-family-body)',
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            SISTEMA EM MANUTENÇÃO
          </div>

          <h1 className="display-xl" style={{ marginBottom: 'var(--primitive-space-4)' }}>
            Sistema temporariamente indisponível
          </h1>

          <p className="caption text-muted" style={{ marginBottom: 'var(--primitive-space-8)', fontStyle: 'italic' }}>
            Não foi possível processar a consulta para ***.456.789-**
          </p>

          {/* ============================================ */}
          {/* CALLOUT DE MANUTENÇÃO */}
          {/* ============================================ */}
          <div style={{
            background: '#FFF0F0',
            borderLeft: '3px solid #CC3333',
            borderRadius: '0 6px 6px 0',
            padding: '16px',
            marginBottom: 'var(--primitive-space-6)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            textAlign: 'left'
          }}>
            <AlertTriangle size={20} color="#CC3333" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: '#CC3333',
              margin: 0,
              lineHeight: 1.5
            }}>
              Nossos servidores estão em manutenção. Tente novamente mais tarde.
            </p>
          </div>

          {/* Botão DESABILITADO */}
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="btn btn--primary btn--lg"
            style={{
              width: '100%',
              fontSize: '18px',
              padding: '18px 32px'
            }}
          >
            VOLTAR PARA A HOME
          </button>
        </section>
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
