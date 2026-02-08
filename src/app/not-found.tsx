"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function NotFound() {
  const router = useRouter();

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
        <Search size={64} color="#1A1A1A" strokeWidth={1.5} />

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
          404
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
          Eita, essa página não existe. Mas a gente pode consultar quem te mandou pra cá. 😏
        </p>

        {/* Botão */}
        <button
          onClick={() => router.push('/')}
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
          Voltar para o início
        </button>
      </main>

      <Footer />
    </div>
  );
}
