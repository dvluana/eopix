"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';

// ============================================
// COMPONENTE: CHECKMARK ICON
// ============================================
function CheckmarkIcon() {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: '#66CC66',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="11"
        viewBox="0 0 14 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 5.5L5 9.5L13 1.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
interface PageProps {
  params: { id: string }
}

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const reportId = params.id;
  // TODO: buscar relatório usando reportId
  console.log('Loading report:', reportId);

  const userEmail = 'joao.silva@gmail.com'; // TODO: pegar da session
  const cpf = '***.456.789-**'; // TODO: pegar do SearchResult
  const dataConsulta = '05/02/2026 às 14:32';
  const dataExpiracao = '12/02/2026';

  const handleLogout = () => {
    alert('Logout realizado!');
    router.push('/');
  };

  const handleRelatarErro = () => {
    alert('Formulário de erro será aberto');
  };

  const handleVoltarConsultas = () => {
    router.push('/minhas-consultas');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0EFEB' }}>
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
          justifyContent: 'space-between',
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        {/* Logo */}
        <LogoFundoPreto />

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: '#888888',
            }}
          >
            {userEmail}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #888888',
              color: '#888888',
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* ============================================ */}
      {/* CONTEÚDO */}
      {/* ============================================ */}
      <main
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* ============================================ */}
        {/* 1. HEADER DO RELATÓRIO */}
        {/* ============================================ */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 8px 0',
            }}
          >
            Consulta: CPF {cpf}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: '#888888',
              }}
            >
              Consultado em {dataConsulta}
            </span>

            <div
              style={{
                background: 'rgba(102, 204, 102, 0.15)',
                color: '#339933',
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '4px 10px',
                borderRadius: '3px',
              }}
            >
              CONCLUÍDO
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* 2. BLOCO CLIMA */}
        {/* ============================================ */}
        <div
          style={{
            marginTop: '32px',
            background: '#FFFDE6',
            border: '1px solid #F5EDB8',
            borderRadius: '6px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Ícone Sol */}
          <div style={{ fontSize: '48px', lineHeight: 1 }}>☀️</div>

          {/* Texto */}
          <div
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1A1A1A',
            }}
          >
            Céu limpo. Nenhuma ocorrência encontrada.
          </div>
        </div>

        {/* ============================================ */}
        {/* 3. DISCLAIMER */}
        {/* ============================================ */}
        <p
          style={{
            marginTop: '12px',
            fontFamily: 'var(--font-family-body)',
            fontSize: '11px',
            color: '#888888',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          Ícones representam volume de registros públicos, não avaliação de
          risco de crédito. A interpretação é exclusivamente sua.
        </p>

        {/* ============================================ */}
        {/* 4. CARD CONSOLIDADO "ATESTADO" */}
        {/* ============================================ */}
        <div
          style={{
            marginTop: '32px',
            background: 'var(--primitive-white)',
            border: '1px solid #E8E7E3',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
            padding: '32px',
            position: 'relative',
          }}
        >
          {/* Checklist */}
          <div>
            {/* Item 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: '1px dashed #E8E7E3',
              }}
            >
              <CheckmarkIcon />
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                }}
              >
                <strong>Situação financeira:</strong> Nome limpo, sem protestos,
                sem dívidas
              </div>
            </div>

            {/* Item 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: '1px dashed #E8E7E3',
              }}
            >
              <CheckmarkIcon />
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                }}
              >
                <strong>Processos judiciais:</strong> Nenhum encontrado
              </div>
            </div>

            {/* Item 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
                borderBottom: '1px dashed #E8E7E3',
              }}
            >
              <CheckmarkIcon />
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: '#1A1A1A',
                }}
              >
                <strong>Menções na web:</strong> Nenhuma ocorrência negativa
              </div>
            </div>

            {/* Item 4 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '16px',
                paddingBottom: '16px',
              }}
            >
              <CheckmarkIcon />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '14px',
                    color: '#1A1A1A',
                  }}
                >
                  <strong>Cadastro empresarial:</strong> Ativo desde 2018
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    color: '#888888',
                    marginTop: '4px',
                  }}
                >
                  (visível apenas para CNPJ)
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* 5. RESUMO IA */}
          {/* ============================================ */}
          <div
            style={{
              marginTop: '24px',
              background: '#F0EFEB',
              borderRadius: '4px',
              padding: '16px',
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-block',
                background: 'var(--primitive-yellow)',
                color: 'var(--primitive-black)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '9px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                padding: '3px 8px',
                borderRadius: '2px',
              }}
            >
              RESUMO IA
            </div>

            {/* Texto */}
            <p
              style={{
                marginTop: '8px',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#666666',
                lineHeight: 1.6,
                margin: '8px 0 0 0',
              }}
            >
              Nenhuma ocorrência financeira, judicial ou de menções negativas na
              web foi encontrada para este CPF nos registros públicos
              consultados.
            </p>
          </div>

          {/* ============================================ */}
          {/* 8. BOTÃO "RELATAR ERRO" */}
          {/* ============================================ */}
          <div
            style={{
              marginTop: '24px',
              textAlign: 'right',
            }}
          >
            <button
              type="button"
              onClick={handleRelatarErro}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-family-body)',
                fontSize: '11px',
                color: '#888888',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Relatar erro
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* 6. TEXTO DE FECHAMENTO */}
        {/* ============================================ */}
        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: 0,
            }}
          >
            Pelo que encontramos, o céu está limpo. Boa parceria!
          </p>
        </div>

        {/* ============================================ */}
        {/* 7. LINKS EXTERNOS */}
        {/* ============================================ */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
          }}
        >
          <a
            href="https://servicos.receita.fazenda.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1A1A1A',
              textDecoration: 'underline',
            }}
          >
            Consultar Receita Federal →
          </a>
          <span style={{ margin: '0 8px', color: '#888888' }}>|</span>
          <a
            href="https://www.serasa.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1A1A1A',
              textDecoration: 'underline',
            }}
          >
            Consultar Serasa →
          </a>
        </div>

        {/* ============================================ */}
        {/* 9. FOOTER */}
        {/* ============================================ */}
        <div
          style={{
            marginTop: '40px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '11px',
              color: '#888888',
              margin: '0 0 16px 0',
            }}
          >
            Relatório gerado em {dataConsulta.split(' às ')[0]}. Dados expiram
            em {dataExpiracao}.
          </p>

          <button
            type="button"
            onClick={handleVoltarConsultas}
            style={{
              background: 'transparent',
              border: '2px solid #1A1A1A',
              color: '#1A1A1A',
              fontFamily: 'var(--font-family-body)',
              fontSize: '13px',
              fontWeight: 600,
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Voltar para Minhas Consultas
          </button>
        </div>
      </main>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <Footer />
    </div>
  );
}
