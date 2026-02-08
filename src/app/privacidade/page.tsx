"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

export default function Page() {
  return (
    <div style={{ minHeight: '100vh', background: '#F0EFEB' }}>
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
        <Link href="/" style={{ textDecoration: 'none' }}>
          <LogoFundoPreto />
        </Link>
      </nav>

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
        <div
          style={{
            background: 'var(--primitive-white)',
            border: '1px solid #E8E7E3',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '48px',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 8px 0',
            }}
          >
            Política de Privacidade
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: '#888888',
              margin: '0 0 32px 0',
            }}
          >
            Última atualização: Fevereiro 2026
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #E8E7E3', margin: '0 0 32px 0' }} />

          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 12px 0',
              }}
            >
              Dados que Coletamos
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Coletamos apenas os dados necessários para prestar o serviço:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>— E-mail informado no momento da compra</div>
              <div style={{ marginBottom: '6px' }}>— CPF ou CNPJ consultado</div>
              <div style={{ marginBottom: '6px' }}>— Dados de pagamento processados pelo Asaas (nome e CPF do comprador)</div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Não coletamos endereço, telefone ou qualquer dado além do estritamente necessário para gerar o relatório e processar o pagamento.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 12px 0',
              }}
            >
              Fontes de Dados Públicos Consultadas
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Para gerar o relatório, consultamos as seguintes fontes públicas:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>— APIFull: protestos, dívidas e situação cadastral</div>
              <div style={{ marginBottom: '6px' }}>— Escavador: processos judiciais em tribunais</div>
              <div style={{ marginBottom: '6px' }}>— BrasilAPI: dados cadastrais de CNPJ (Receita Federal)</div>
              <div style={{ marginBottom: '6px' }}>— Google Custom Search: menções na web e Reclame Aqui</div>
              <div style={{ marginBottom: '6px' }}>— OpenAI: geração de resumo textual (os dados são enviados de forma anonimizada)</div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nenhuma dessas fontes recebe o e-mail ou dados pessoais do comprador.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 12px 0',
              }}
            >
              Base Legal
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              O tratamento de dados é realizado com base no Legítimo Interesse (Art. 7, IX da LGPD) para dados públicos agregados, e no Consentimento (Art. 7, I) para o e-mail e dados de pagamento fornecidos voluntariamente pelo usuário. Um Legitimate Interest Assessment (LIA) está documentado internamente.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 12px 0',
              }}
            >
              Compartilhamento com Terceiros
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Compartilhamos dados estritamente necessários com:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>— Asaas: processamento de pagamento Pix (recebe e-mail do comprador)</div>
              <div style={{ marginBottom: '6px' }}>— Resend: envio de e-mails transacionais (recebe e-mail do usuário)</div>
              <div style={{ marginBottom: '6px' }}>— Neon: armazenamento de dados em banco PostgreSQL</div>
              <div style={{ marginBottom: '6px' }}>— Plausible: analytics anônimo, sem cookies, sem dados pessoais</div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Nenhum terceiro recebe dados para fins de marketing, publicidade ou revenda.
            </p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 12px 0',
              }}
            >
              Seus Direitos
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: '0 0 12px 0',
              }}
            >
              Conforme a LGPD, você tem direito a:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '6px' }}>— Acessar os dados que temos sobre você</div>
              <div style={{ marginBottom: '6px' }}>— Solicitar correção de dados incorretos</div>
              <div style={{ marginBottom: '6px' }}>— Solicitar exclusão dos seus dados</div>
              <div style={{ marginBottom: '6px' }}>— Solicitar a portabilidade dos seus dados</div>
              <div style={{ marginBottom: '6px' }}>— Revogar consentimento a qualquer momento</div>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Para exercer qualquer desses direitos, entre em contato através do e-mail{' '}
              <a
                href="mailto:privacidade@somoseopix.com"
                style={{
                  color: '#1A1A1A',
                  textDecoration: 'underline',
                }}
              >
                privacidade@somoseopix.com
              </a>
              .
            </p>
          </section>

          <div
            style={{
              paddingTop: '24px',
              borderTop: '1px solid #E8E7E3',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Link
              href="/termos"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: '#1A1A1A',
                textDecoration: 'underline',
              }}
            >
              ← Termos de Uso
            </Link>

            <Link
              href="/privacidade/titular"
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: '#1A1A1A',
                textDecoration: 'underline',
              }}
            >
              Direitos do Titular →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
