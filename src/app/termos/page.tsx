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
      {/* CONTEÚDO */}
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
          {/* Título */}
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0',
            }}
          >
            Termos de Uso
          </h1>

          {/* Subtítulo */}
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-tertiary)',
              margin: '0 0 32px 0',
            }}
          >
            Última atualização: Fevereiro 2026
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
          {/* 1. Natureza do Serviço */}
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
              Natureza do Serviço
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
              O E O PIX? é uma ferramenta de agregação de dados públicos.
              Consultamos registros abertos de protestos, processos judiciais,
              notícias e cadastro empresarial para gerar um relatório
              consolidado. Não somos um bureau de crédito, não calculamos score
              e não oferecemos recomendações de crédito ou risco.
            </p>
          </section>

          {/* ============================================ */}
          {/* 2. Isenção de Veracidade */}
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
              Isenção de Veracidade
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
              Os dados exibidos são obtidos de fontes públicas (Receita
              Federal, tribunais, Serasa Experian, Escavador, Reclame Aqui e
              outros). Não garantimos a completude, atualidade ou exatidão dos
              dados. A responsabilidade pela interpretação é exclusivamente do
              usuário.
            </p>
          </section>

          {/* ============================================ */}
          {/* 3. Aviso de Homônimos */}
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
              Aviso de Homônimos
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
              Consultas por CPF podem retornar resultados de homônimos,
              especialmente em processos judiciais onde a individualização
              depende do número do documento. Se você identificar dados
              incorretos, utilize a página{' '}
              <a
                href="/privacidade/titular"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'underline',
                }}
              >
                Direitos do Titular
              </a>{' '}
              para solicitar correção.
            </p>
          </section>

          {/* ============================================ */}
          {/* 4. Política de Reembolso */}
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
              Política de Reembolso
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
              Reembolsos são concedidos exclusivamente em caso de falha técnica
              que impeça a geração do relatório. Erros de digitação no CPF/CNPJ
              ou no e-mail não geram direito a reembolso. Em caso de falha
              técnica, o reembolso é processado automaticamente via Pix em até
              24 horas.
            </p>
          </section>

          {/* ============================================ */}
          {/* 5. Propriedade Intelectual */}
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
              Propriedade Intelectual
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
              O layout, a marca E O PIX?, os textos originais e o código-fonte
              são propriedade dos titulares do serviço. Os dados públicos
              agregados não são de nossa autoria e pertencem às respectivas
              fontes.
            </p>
          </section>

          {/* ============================================ */}
          {/* 6. Foro */}
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
              Foro
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
              Fica eleito o foro da comarca de Florianópolis/SC para dirimir
              quaisquer controvérsias.
            </p>
          </section>

          {/* ============================================ */}
          {/* RODAPÉ DO CARD */}
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
