"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column' }}>
      {/* NAV */}
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
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <LogoFundoPreto />
        </button>
      </nav>

      {/* CONTEÚDO CENTRALIZADO */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '64px',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Ícone */}
        <Clock size={64} style={{ color: 'var(--color-text-tertiary)' }} strokeWidth={1.5} />

        {/* Título */}
        <h1
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginTop: '20px',
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          Relatório Expirado
        </h1>

        {/* Mensagem */}
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            maxWidth: '480px',
            textAlign: 'center',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          Este relatório expirou. Os dados são removidos após 7 dias por segurança.
        </p>

        {/* Callout informativo */}
        <div
          style={{
            background: 'var(--color-bg-secondary)',
            borderLeft: '3px solid var(--color-border-accent)',
            borderRadius: '0 6px 6px 0',
            padding: '12px 16px',
            marginTop: '16px',
            maxWidth: '480px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Seus dados de compra continuam salvos. Você pode fazer uma nova consulta a qualquer momento.
          </p>
        </div>

        {/* Botão */}
        <button
          onClick={() => router.push('/')}
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            background: 'var(--color-bg-accent)',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            marginTop: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          Fazer nova consulta
        </button>
      </main>

      <Footer />
    </div>
  );
}
