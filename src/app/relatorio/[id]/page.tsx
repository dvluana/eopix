"use client"

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import Footer from '@/components/Footer';
import {
  ReportHeader,
  ClimateBlock,
  Disclaimer,
  ChecklistCard,
  FinancialCard,
  JudicialCard,
  WebMentionsCard,
  AiSummary,
  ReportFooter,
  ReportError,
} from '@/components/relatorio';

interface PageProps {
  params: { id: string }
}

// Mock data para demonstração
const mockDataSol = {
  cpf: '***.456.789-**',
  dataConsulta: '05/02/2026 às 14:32',
  dataExpiracao: '12/02/2026',
  weatherStatus: 'sol' as const,
  climateMessage: 'Céu limpo. Nenhuma ocorrência encontrada.',
  checklistItems: [
    { label: 'Situação financeira', detail: 'Nome limpo, sem protestos, sem dívidas', status: 'ok' as const },
    { label: 'Processos judiciais', detail: 'Nenhum encontrado', status: 'ok' as const },
    { label: 'Menções na web', detail: 'Nenhuma ocorrência negativa', status: 'ok' as const },
    { label: 'Cadastro empresarial', detail: 'Ativo desde 2018', status: 'ok' as const, note: '(visível apenas para CNPJ)' },
  ],
  protestos: [],
  processos: [],
  mentions: [],
  aiSummary: 'Nenhuma ocorrência financeira, judicial ou de menções negativas na web foi encontrada para este CPF nos registros públicos consultados.',
  closingMessage: 'Pelo que encontramos, o céu está limpo. Boa parceria!',
};

const mockDataChuva = {
  cpf: '***.789.123-**',
  dataConsulta: '05/02/2026 às 15:47',
  dataExpiracao: '12/02/2026',
  weatherStatus: 'chuva' as const,
  climateMessage: 'Encontramos alguns pontos de atenção.',
  checklistItems: [
    { label: 'Situação financeira', detail: '2 protestos encontrados', status: 'warning' as const },
    { label: 'Processos judiciais', detail: '1 processo como réu', status: 'warning' as const },
    { label: 'Menções na web', detail: 'Nenhuma ocorrência negativa', status: 'ok' as const },
    { label: 'Cadastro empresarial', detail: 'Regular desde 2020', status: 'ok' as const },
  ],
  protestos: [
    { data: '15/01/2025', valor: 'R$ 1.250,00', cartorio: '3º Cartório de Protestos - SP' },
    { data: '03/11/2024', valor: 'R$ 890,50', cartorio: '1º Cartório de Protestos - SP' },
  ],
  processos: [
    { tribunal: 'TJSP', data: '22/08/2024', classe: 'Cobrança', polo: 'reu' as const },
  ],
  mentions: [
    {
      fonte: 'Reclame Aqui',
      data: '10/12/2024',
      resumo: 'Reclamação sobre atraso na entrega de produto. Empresa respondeu e caso foi resolvido.',
      url: 'https://example.com',
    },
  ],
  aiSummary: 'Foram identificados 2 protestos em cartório totalizando R$ 2.140,50 e 1 processo judicial como réu no TJSP. Recomenda-se verificar a situação financeira antes de prosseguir com negociações.',
  closingMessage: 'Encontramos pontos de atenção. Avalie com cuidado.',
};

export default function Page({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = params.id;

  // Detecta qual layout mostrar via query param (para demo)
  const variant = searchParams?.get('variant') || 'sol';
  const data = variant === 'chuva' ? mockDataChuva : mockDataSol;

  const userEmail = 'joao.silva@gmail.com';

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

  console.log('Loading report:', reportId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
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
          justifyContent: 'space-between',
          paddingLeft: '32px',
          paddingRight: '32px',
          zIndex: 1000,
        }}
      >
        <LogoFundoPreto />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-inverse-muted)',
            }}
          >
            {userEmail}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-text-inverse-muted)',
              color: 'var(--color-text-inverse-muted)',
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

      {/* CONTEÚDO */}
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
        {/* 1. HEADER DO RELATÓRIO */}
        <ReportHeader
          cpf={data.cpf}
          dataConsulta={data.dataConsulta}
          status="concluido"
        />

        {/* 2. BLOCO CLIMA */}
        <ClimateBlock
          weatherStatus={data.weatherStatus}
          message={data.climateMessage}
        />

        {/* 3. DISCLAIMER */}
        <Disclaimer />

        {/* 4. CHECKLIST */}
        <ChecklistCard
          items={data.checklistItems}
          variant={data.weatherStatus}
        />

        {/* 5. CARDS ESPECÍFICOS DE CHUVA */}
        {data.weatherStatus === 'chuva' && (
          <>
            <FinancialCard protestos={data.protestos} />
            <JudicialCard processos={data.processos} />
            <WebMentionsCard mentions={data.mentions} />
          </>
        )}

        {/* 6. RESUMO IA + BOTÃO ERRO (dentro de card para Sol) */}
        {data.weatherStatus === 'sol' ? (
          <div
            style={{
              marginTop: '-16px',
              background: 'var(--primitive-white)',
              border: '1px solid var(--color-border-subtle)',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
              padding: '0 32px 32px',
            }}
          >
            <AiSummary summary={data.aiSummary} />
            <ReportError onRelatarErro={handleRelatarErro} />
          </div>
        ) : (
          <div style={{ marginTop: '24px' }}>
            <div
              style={{
                background: 'var(--primitive-white)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
                padding: '24px',
              }}
            >
              <AiSummary summary={data.aiSummary} />
              <ReportError onRelatarErro={handleRelatarErro} />
            </div>
          </div>
        )}

        {/* 7. TEXTO DE FECHAMENTO */}
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
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {data.closingMessage}
          </p>
        </div>

        {/* 8. LINKS EXTERNOS */}
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
              color: 'var(--color-text-primary)',
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
              color: 'var(--color-text-primary)',
              textDecoration: 'underline',
            }}
          >
            Consultar Serasa →
          </a>
        </div>

        {/* 9. FOOTER DO RELATÓRIO */}
        <ReportFooter
          dataConsulta={data.dataConsulta}
          dataExpiracao={data.dataExpiracao}
          onVoltarConsultas={handleVoltarConsultas}
        />
      </main>

      {/* FOOTER GLOBAL */}
      <Footer />
    </div>
  );
}
