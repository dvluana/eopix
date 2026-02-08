"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
  const router = useRouter();

  const handleTryAgain = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0EFEB', display: 'flex', flexDirection: 'column' }}>
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
        <AlertTriangle size={64} color="#CC3333" strokeWidth={1.5} />

        {/* Título */}
        <h1
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginTop: '20px',
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          500
        </h1>

        {/* Mensagem */}
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            color: '#666666',
            lineHeight: 1.7,
            maxWidth: '480px',
            textAlign: 'center',
            marginTop: '12px',
            marginBottom: 0,
          }}
        >
          Algo deu errado do nosso lado. Já estamos cuidando.
        </p>

        {/* Texto secundário */}
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            color: '#888888',
            textAlign: 'center',
            marginTop: '8px',
            marginBottom: 0,
          }}
        >
          Se o problema persistir, tente novamente em alguns minutos.
        </p>

        {/* Botão */}
        <button
          onClick={handleTryAgain}
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1A1A1A',
            background: '#FFD600',
            border: 'none',
            borderRadius: '8px',
            padding: '16px 32px',
            marginTop: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E6C000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFD600';
          }}
        >
          Tentar novamente
        </button>
      </main>

      <Footer />
    </div>
  );
}
