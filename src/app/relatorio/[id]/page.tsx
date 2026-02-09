"use client"

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  CompanyInfoCard,
  PersonInfoCard,
  ReclameAquiCard,
  LimitedDataWarning,
  PositiveMentionsBlock,
} from '@/components/relatorio';
import {
  sortProcessesByGravity,
  sortFinancialByValue,
  sortMentionsByClassification,
  generateProcessDetail,
  generateFinancialDetail,
} from '@/lib/report-utils';
import type {
  CpfCadastralResponse,
  ProcessosCpfResponse,
  SrsPremiumCpfResponse,
  SrsPremiumCnpjResponse,
  DossieResponse,
  FinancialSummary,
  ProcessAnalysis,
  GoogleSearchResponse,
  ReclameAquiData,
} from '@/types/report';

interface ReportData {
  id: string
  term: string
  type: 'CPF' | 'CNPJ'
  name: string
  data: {
    cadastral?: CpfCadastralResponse       // CPF cadastral (r-cpf-completo)
    processos?: ProcessosCpfResponse       // Processos (r-acoes-e-processos-judiciais)
    financial?: SrsPremiumCpfResponse | SrsPremiumCnpjResponse  // Financeiro (srs-premium)
    dossie?: DossieResponse                // CNPJ dossie (ic-dossie-juridico)
    financialSummary?: FinancialSummary    // Resumo financeiro calculado
    processAnalysis?: ProcessAnalysis[]    // Análise IA de processos
    google?: GoogleSearchResponse          // Menções web
    reclameAqui?: ReclameAquiData          // Reclame Aqui
  }
  summary: string
  createdAt: string
  expiresAt: string
}

// Format date from ISO to Brazilian format
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month}/${year} às ${hours}:${minutes}`
}

function formatDateOnly(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Format currency (values are in BRL, not cents)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

export default function Page() {
  const params = useParams();
  const reportId = params.id as string;
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/report/${reportId}`);

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 401) {
            router.push(`/login?redirect=/relatorio/${reportId}`);
            return;
          }
          throw new Error(data.error || 'Erro ao carregar relatório');
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email || '');
        }
      } catch {
        // Ignore session fetch errors
      }
    }

    fetchReport();
    fetchSession();
  }, [reportId, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  const handleRelatarErro = () => {
    const subject = encodeURIComponent(`Erro no relatório ${reportId}`);
    const body = encodeURIComponent(`Olá,\n\nEncontrei um erro no relatório ${reportId}.\n\nDescrição do problema:\n\n`);
    window.open(`mailto:suporte@eopix.com.br?subject=${subject}&body=${body}`);
  };

  const handleVoltarConsultas = () => {
    router.push('/minhas-consultas');
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
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
            zIndex: 1000,
          }}
        >
          <LogoFundoPreto />
        </nav>
        <main
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: 'calc(64px + 24px)',
            paddingBottom: '60px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          {/* LINK VOLTAR */}
          <button
            type="button"
            onClick={() => router.push('/minhas-consultas')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              marginBottom: '16px',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Minhas Consultas
          </button>

          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div
              style={{
                display: 'inline-block',
                width: '48px',
                height: '48px',
                border: '4px solid var(--color-border-subtle)',
                borderTopColor: 'var(--color-accent-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p
              style={{
                marginTop: '24px',
                fontFamily: 'var(--font-family-body)',
                fontSize: '16px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Carregando relatório...
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
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
            zIndex: 1000,
          }}
        >
          <LogoFundoPreto />
        </nav>
        <main
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: 'calc(64px + 24px)',
            paddingBottom: '60px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          {/* LINK VOLTAR */}
          <button
            type="button"
            onClick={() => router.push('/minhas-consultas')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              marginBottom: '16px',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-body)',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Minhas Consultas
          </button>

          <div
            style={{
              background: 'var(--primitive-white)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '8px',
              padding: '48px 32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Oops!
            </p>
            <p
              style={{
                marginTop: '16px',
                fontFamily: 'var(--font-family-body)',
                fontSize: '16px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {error || 'Não foi possível carregar o relatório.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/minhas-consultas')}
              style={{
                marginTop: '24px',
                background: 'var(--color-accent-primary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Voltar para Minhas Consultas
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Transform API data to component format
  const cadastral = report.data.cadastral;
  const financial = report.data.financial;
  const financialSummary = report.data.financialSummary;
  const processos = report.data.processos;
  // processAnalysis disponível em report.data.processAnalysis para uso futuro
  const google = report.data.google;
  const dossie = report.data.dossie;
  const reclameAqui = report.data.reclameAqui;

  // Extract process list (from processos or dossie for CNPJ)
  const processCount = processos?.totalProcessos || 0;

  // Determine weather status based on data
  const hasProtests = (financialSummary?.totalProtestos || 0) > 0;
  const hasDebts = (financialSummary?.totalDividas || 0) > 0;
  const hasBouncedChecks = (financialSummary?.chequesSemFundo || 0) > 0;
  const hasProcesses = processCount > 0 || (dossie?.acoesAtivas?.quantidade || 0) > 0;
  const allMentions = [...(google?.byDocument || []), ...(google?.byName || [])];
  const hasNegativeMentions = allMentions.some(m => m.classification === 'negative');
  const isCompanyInactive = report.type === 'CNPJ' && dossie && dossie.situacao !== 'ATIVA';
  const hasNegativeReclameAqui = reclameAqui && reclameAqui.nota !== null && reclameAqui.nota < 7;

  const weatherStatus = (hasProtests || hasDebts || hasBouncedChecks || hasProcesses || hasNegativeMentions || isCompanyInactive || hasNegativeReclameAqui) ? 'chuva' : 'sol';

  // Calculate total occurrences for climate message
  const totalOccurrences =
    (financialSummary?.totalProtestos || 0) +
    (financialSummary?.totalDividas || 0) +
    (hasBouncedChecks ? financialSummary?.chequesSemFundo || 0 : 0) +
    processCount +
    (dossie?.acoesAtivas?.quantidade || 0) +
    allMentions.filter(m => m.classification === 'negative').length +
    (isCompanyInactive ? 1 : 0) +
    (hasNegativeReclameAqui ? 1 : 0);

  // Check for limited data
  const hasLimitedData = !cadastral?.nome && !dossie?.razaoSocial && processCount === 0 && allMentions.length === 0;

  // Build checklist items
  const checklistItems = [];

  // Financial status - with rich detail including values
  if (hasProtests || hasDebts) {
    const protestCount = financialSummary?.totalProtestos || 0;
    const protestTotal = financialSummary?.valorTotalProtestos || 0;
    const debtCount = financialSummary?.totalDividas || 0;
    const debtTotal = financialSummary?.valorTotalDividas || 0;

    const financialDetail = generateFinancialDetail(
      { count: protestCount, totalAmount: protestTotal },
      { count: debtCount, totalAmount: debtTotal },
      financialSummary?.chequesSemFundo || 0
    );

    checklistItems.push({
      label: 'Situação financeira',
      detail: financialDetail,
      status: 'warning' as const,
    });
  } else {
    checklistItems.push({
      label: 'Situação financeira',
      detail: 'Sem protestos ou dívidas',
      status: 'ok' as const,
    });
  }

  // Judicial status - with rich detail including process types
  // Transform processos to format expected by generateProcessDetail
  const processesForDetail = processos?.processos?.map(p => ({
    tribunal: p.tribunal,
    date: p.dataAutuacao,
    classe: p.classeProcessual?.nome || '',
    polo: p.partes?.find(part => part.nome.toLowerCase().includes(report.name.toLowerCase()))?.polo === 'PASSIVO' ? 'reu' : 'autor',
  })) || [];

  if (hasProcesses) {
    const processDetail = generateProcessDetail(processesForDetail);
    checklistItems.push({
      label: 'Processos judiciais',
      detail: processDetail,
      status: 'warning' as const,
    });
  } else {
    checklistItems.push({
      label: 'Processos judiciais',
      detail: 'Nenhum encontrado',
      status: 'ok' as const,
    });
  }

  // Web mentions
  if (hasNegativeMentions) {
    const negativeCount = allMentions.filter(m => m.classification === 'negative').length;
    checklistItems.push({
      label: 'Menções na web',
      detail: `${negativeCount} ocorrência${negativeCount > 1 ? 's' : ''} negativa${negativeCount > 1 ? 's' : ''}`,
      status: 'warning' as const,
    });
  } else {
    checklistItems.push({
      label: 'Menções na web',
      detail: 'Nenhuma ocorrência negativa',
      status: 'ok' as const,
    });
  }

  // Company status (CNPJ only)
  if (report.type === 'CNPJ' && dossie) {
    checklistItems.push({
      label: 'Cadastro empresarial',
      detail: dossie.situacao === 'ATIVA'
        ? `Ativo${dossie.dataAbertura ? ` desde ${new Date(dossie.dataAbertura).getFullYear()}` : ''}`
        : dossie.situacao || 'Verificar situação',
      status: dossie.situacao === 'ATIVA' ? 'ok' as const : 'warning' as const,
    });
  }

  // Format protests for FinancialCard (sorted by value, highest first)
  const protestosFormatted = (financial?.protestos || []).map(p => ({
    data: formatDateOnly(p.data),
    valor: formatCurrency(p.valor),
    cartorio: p.cartorio,
  }));
  const protestosCard = sortFinancialByValue(protestosFormatted);

  // Format debts for FinancialCard (sorted by value, highest first)
  const dividasFormatted = (financial?.pendenciasFinanceiras || []).map(d => ({
    tipo: d.tipo,
    valor: formatCurrency(d.valor),
    origem: d.origem,
  }));
  const dividas = sortFinancialByValue(dividasFormatted);

  // Calculate total amounts for financial card
  const totalProtestosValor = financialSummary?.valorTotalProtestos ? formatCurrency(financialSummary.valorTotalProtestos) : undefined;
  const totalDividasValor = financialSummary?.valorTotalDividas ? formatCurrency(financialSummary.valorTotalDividas) : undefined;

  // Sort processes by gravity and format for JudicialCard
  const sortedProcesses = sortProcessesByGravity(processesForDetail);
  const processosCard = sortedProcesses.map(p => ({
    tribunal: p.tribunal,
    data: formatDateOnly(p.date),
    classe: p.classe,
    polo: (p.polo?.toLowerCase() === 'reu' || p.polo?.toLowerCase() === 'réu')
      ? 'reu' as const
      : p.polo?.toLowerCase() === 'testemunha'
        ? 'testemunha' as const
        : 'autor' as const,
  }));

  // Sort mentions by classification (negative first)
  const sortedMentions = sortMentionsByClassification(allMentions);

  // Format web mentions for WebMentionsCard (negative)
  const negativeMentions = sortedMentions
    .filter(m => m.classification === 'negative')
    .map(m => ({
      fonte: new URL(m.url).hostname.replace('www.', ''),
      data: '',
      resumo: m.snippet || m.title,
      url: m.url,
      classification: m.classification as 'negative',
    }));

  // Format web mentions for PositiveMentionsBlock (positive/neutral)
  const positiveMentions = sortedMentions
    .filter(m => m.classification === 'positive' || m.classification === 'neutral')
    .map(m => ({
      fonte: new URL(m.url).hostname.replace('www.', ''),
      resumo: m.snippet || m.title,
      url: m.url,
    }));

  const climateMessage = weatherStatus === 'sol'
    ? 'Céu limpo. Nenhuma ocorrência encontrada.'
    : undefined; // Will use occurrenceCount

  const closingMessage = weatherStatus === 'sol'
    ? 'Pelo que encontramos, o céu está limpo. Boa parceria!'
    : 'Encontramos pontos de atenção. Avalie com cuidado.';

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
          {userEmail && (
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                color: 'var(--color-text-inverse-muted)',
              }}
            >
              {userEmail}
            </span>
          )}
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
          paddingTop: 'calc(64px + 24px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* LINK VOLTAR */}
        <button
          type="button"
          onClick={handleVoltarConsultas}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            padding: '8px 0',
            marginBottom: '16px',
            cursor: 'pointer',
            fontFamily: 'var(--font-family-body)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Minhas Consultas
        </button>

        {/* 1. HEADER DO RELATÓRIO */}
        <ReportHeader
          cpf={report.term}
          dataConsulta={formatDate(report.createdAt)}
          status="concluido"
        />

        {/* 2. BLOCO CLIMA */}
        <ClimateBlock
          weatherStatus={weatherStatus}
          message={climateMessage}
          occurrenceCount={weatherStatus === 'chuva' ? totalOccurrences : undefined}
        />

        {/* 2.1 AVISO DE DADOS LIMITADOS (se aplicável) */}
        {hasLimitedData && (
          <LimitedDataWarning />
        )}

        {/* 3. DISCLAIMER */}
        <Disclaimer />

        {/* 4. CHECKLIST */}
        <ChecklistCard
          items={checklistItems}
          variant={weatherStatus}
        />

        {/* 4.1 COMPANY INFO CARD (CNPJ only) */}
        {report.type === 'CNPJ' && dossie && (
          <CompanyInfoCard
            razaoSocial={dossie.razaoSocial}
            situacao={dossie.situacao || 'ATIVA'}
            dataAbertura={dossie.dataAbertura ?? undefined}
            cnaePrincipal={dossie.cnaePrincipal ?? undefined}
            socios={dossie.socios}
            capitalSocial={dossie.capitalSocial ?? undefined}
          />
        )}

        {/* 4.2 PERSON INFO CARD (CPF only) */}
        {report.type === 'CPF' && cadastral && (
          <PersonInfoCard
            cadastral={{
              nome: cadastral.nome,
              idade: cadastral.idade,
              situacaoRF: cadastral.situacaoRF,
              enderecos: cadastral.enderecos || [],
              telefones: cadastral.telefones || [],
              emails: cadastral.emails || [],
              empresasVinculadas: cadastral.empresasVinculadas || [],
            }}
          />
        )}

        {/* 4.3 ACTIVITY INDICATOR - removido pois recentInquiries não está mais disponível */}

        {/* 4.4 RECLAME AQUI CARD */}
        {reclameAqui && reclameAqui.nota !== null && reclameAqui.indiceResolucao !== null && reclameAqui.url && (
          <ReclameAquiCard
            nota={reclameAqui.nota}
            indiceResolucao={reclameAqui.indiceResolucao}
            totalReclamacoes={reclameAqui.totalReclamacoes ?? undefined}
            respondidas={reclameAqui.respondidas ?? undefined}
            seloRA1000={reclameAqui.seloRA1000}
            url={reclameAqui.url}
          />
        )}

        {/* 5. CARDS ESPECÍFICOS DE CHUVA */}
        {weatherStatus === 'chuva' && (
          <>
            {(protestosCard.length > 0 || dividas.length > 0 || hasBouncedChecks) && (
              <FinancialCard
                protestos={protestosCard}
                dividas={dividas}
                chequesDevolvidos={financialSummary?.chequesSemFundo}
                nomeSujo={hasProtests || hasDebts}
                totalProtestos={financialSummary?.totalProtestos}
                totalProtestosValor={totalProtestosValor}
                totalDividas={financialSummary?.totalDividas}
                totalDividasValor={totalDividasValor}
              />
            )}
            {processosCard.length > 0 && <JudicialCard processos={processosCard} />}
            {negativeMentions.length > 0 && <WebMentionsCard mentions={negativeMentions} variant="chuva" />}
          </>
        )}

        {/* 5.1 MENÇÕES POSITIVAS (Sol) */}
        {weatherStatus === 'sol' && positiveMentions.length > 0 && (
          <PositiveMentionsBlock mentions={positiveMentions} />
        )}

        {/* 6. RESUMO IA + BOTÃO ERRO (dentro de card para Sol) */}
        {weatherStatus === 'sol' ? (
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
            <AiSummary summary={report.summary} />
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
              <AiSummary summary={report.summary} />
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
            {closingMessage}
          </p>
        </div>

        {/* 8. FOOTER DO RELATÓRIO */}
        <ReportFooter
          dataConsulta={formatDate(report.createdAt)}
          dataExpiracao={formatDateOnly(report.expiresAt)}
          onVoltarConsultas={handleVoltarConsultas}
        />
      </main>

      {/* FOOTER GLOBAL */}
      <Footer />
    </div>
  );
}
