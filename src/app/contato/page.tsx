"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
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
      </nav>

      {/* ============================================ */}
      {/* CONTEUDO */}
      {/* ============================================ */}
      <main
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Card Container */}
        <div
          style={{
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '48px',
          }}
        >
          {/* Titulo */}
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Contato
          </h1>

          {/* Subtitulo */}
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 32px 0',
            }}
          >
            Última atualização: Março 2026
          </p>

          {/* Separador */}
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--color-border-subtle)',
              margin: '0 0 32px 0',
            }}
          />

          {/* ============================================ */}
          {/* 1. Contato Geral */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Contato Geral
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Para dúvidas, reclamações ou solicitações relacionadas ao serviço, entre em contato pelo e-mail:{' '}
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Nosso prazo de resposta é de até 5 dias úteis.
            </p>
          </section>

          {/* ============================================ */}
          {/* 2. Encarregado de Dados (DPO) */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Encarregado de Dados (DPO)
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nos termos do art. 41 da LGPD, o canal de contato do Encarregado pelo Tratamento de Dados Pessoais é:{' '}
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              O Encarregado de Dados é responsável por aceitar reclamações e comunicações dos titulares de dados, receber comunicações da Autoridade Nacional de Proteção de Dados (ANPD), e orientar sobre as práticas de proteção de dados pessoais.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Para solicitações específicas de titulares de dados (exclusão, correção, acesso, bloqueio), utilize a página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>
              .
            </p>
          </section>

          {/* ============================================ */}
          {/* 3. Dados da Controladora */}
          {/* ============================================ */}
          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Dados da Controladora
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Razão social: EROS &amp; CO NEGOCIOS LTDA
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              CNPJ: 65.462.245/0001-86
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Endereço: Av. Brigadeiro Faria Lima, 1811, Apt. 1119, Jardim Paulistano, São Paulo/SP, CEP 01452-001
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              E-mail:{' '}
              <a
                href="mailto:plataforma@somoseopix.com.br"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                plataforma@somoseopix.com.br
              </a>
            </p>
          </section>

          {/* ============================================ */}
          {/* 4. Autoridade Nacional de Protecao de Dados (ANPD) */}
          {/* ============================================ */}
          <section style={{ marginBottom: '40px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 12px 0',
              }}
            >
              Autoridade Nacional de Proteção de Dados (ANPD)
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Caso não fique satisfeito com o atendimento da EOPIX em relação a seus dados pessoais, você tem o direito de apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                margin: '12px 0 0 0',
              }}
            >
              Site:{' '}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                gov.br/anpd
              </a>
            </p>
          </section>

          {/* ============================================ */}
          {/* RODAPE DO CARD */}
          {/* ============================================ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
            }}
          >
            {/* Esquerda */}
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              ← Voltar para o início
            </Link>

            {/* Direita */}
            <Link
              href="/privacidade"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-primary)',
                textDecoration: 'underline',
              }}
            >
              Política de Privacidade →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
