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
} from '@/components/relatorio';

interface ApiFullData {
  name?: string
  razaoSocial?: string
  cleanNameYears?: number | null
  recentInquiries?: number
  protests?: Array<{
    date: string
    amount: number
    registry: string
  }>
  debts?: Array<{
    type: string
    amount: number
    origin: string
  }>
  bouncedChecks?: number
  totalProtests?: number
  totalProtestsAmount?: number
  region?: string
}

interface ProcessData {
  tribunal: string
  date: string
  classe: string
  polo: string
  number?: string
  source?: string
}

interface GoogleResult {
  title: string
  url: string
  snippet?: string
  classification?: 'positive' | 'negative' | 'neutral'
}

interface GoogleData {
  general?: GoogleResult[]
  focused?: GoogleResult[]
  reclameAqui?: GoogleResult[]
}

interface BrasilApiData {
  razaoSocial: string
  situacao?: string
  dataAbertura?: string
}

interface ReportData {
  id: string
  term: string
  type: 'CPF' | 'CNPJ'
  name: string
  data: {
    apiFull?: ApiFullData
    brasilApi?: BrasilApiData
    processes?: ProcessData[]
    google?: GoogleData
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

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100) // assuming amount is in cents
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
            paddingTop: 'calc(64px + 100px)',
            paddingBottom: '60px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
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
            paddingTop: 'calc(64px + 100px)',
            paddingBottom: '60px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--primitive-white)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '8px',
              padding: '48px 32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
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
                color: 'var(--primitive-white)',
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
  const apiFull = report.data.apiFull || {};
  const processes = report.data.processes || [];
  const google = report.data.google || {};
  const brasilApi = report.data.brasilApi;

  // Determine weather status based on data
  const hasProtests = (apiFull.protests?.length || 0) > 0 || (apiFull.totalProtests || 0) > 0;
  const hasDebts = (apiFull.debts?.length || 0) > 0;
  const hasProcesses = processes.length > 0;
  const hasNegativeMentions = [
    ...(google.general || []),
    ...(google.focused || []),
  ].some(m => m.classification === 'negative');

  const weatherStatus = (hasProtests || hasDebts || hasProcesses || hasNegativeMentions) ? 'chuva' : 'sol';

  // Build checklist items
  const checklistItems = [];

  // Financial status
  if (hasProtests || hasDebts) {
    const protestCount = apiFull.totalProtests || apiFull.protests?.length || 0;
    const debtCount = apiFull.debts?.length || 0;
    const details: string[] = [];
    if (protestCount > 0) details.push(`${protestCount} protesto${protestCount > 1 ? 's' : ''}`);
    if (debtCount > 0) details.push(`${debtCount} dívida${debtCount > 1 ? 's' : ''}`);
    checklistItems.push({
      label: 'Situação financeira',
      detail: details.join(', ') + ' encontrado(s)',
      status: 'warning' as const,
    });
  } else {
    checklistItems.push({
      label: 'Situação financeira',
      detail: apiFull.cleanNameYears
        ? `Nome limpo há ${apiFull.cleanNameYears} anos`
        : 'Sem protestos ou dívidas',
      status: 'ok' as const,
    });
  }

  // Judicial status
  if (hasProcesses) {
    const asReu = processes.filter(p => p.polo?.toLowerCase() === 'reu' || p.polo?.toLowerCase() === 'réu').length;
    checklistItems.push({
      label: 'Processos judiciais',
      detail: asReu > 0
        ? `${asReu} processo${asReu > 1 ? 's' : ''} como réu`
        : `${processes.length} processo${processes.length > 1 ? 's' : ''} encontrado${processes.length > 1 ? 's' : ''}`,
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
    const negativeCount = [...(google.general || []), ...(google.focused || [])].filter(m => m.classification === 'negative').length;
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
  if (report.type === 'CNPJ' && brasilApi) {
    checklistItems.push({
      label: 'Cadastro empresarial',
      detail: brasilApi.situacao === 'ATIVA'
        ? `Ativo${brasilApi.dataAbertura ? ` desde ${new Date(brasilApi.dataAbertura).getFullYear()}` : ''}`
        : brasilApi.situacao || 'Verificar situação',
      status: brasilApi.situacao === 'ATIVA' ? 'ok' as const : 'warning' as const,
    });
  }

  // Format protests for FinancialCard
  const protestos = (apiFull.protests || []).map(p => ({
    data: formatDateOnly(p.date),
    valor: formatCurrency(p.amount),
    cartorio: p.registry,
  }));

  // Format processes for JudicialCard
  const processos = processes.slice(0, 5).map(p => ({
    tribunal: p.tribunal,
    data: formatDateOnly(p.date),
    classe: p.classe,
    polo: (p.polo?.toLowerCase() === 'reu' || p.polo?.toLowerCase() === 'réu') ? 'reu' as const : 'autor' as const,
  }));

  // Format web mentions for WebMentionsCard
  const mentions = [...(google.general || []), ...(google.focused || [])]
    .filter(m => m.classification === 'negative')
    .slice(0, 5)
    .map(m => ({
      fonte: new URL(m.url).hostname.replace('www.', ''),
      data: '',
      resumo: m.snippet || m.title,
      url: m.url,
    }));

  const climateMessage = weatherStatus === 'sol'
    ? 'Céu limpo. Nenhuma ocorrência encontrada.'
    : 'Encontramos alguns pontos de atenção.';

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
          paddingTop: 'calc(64px + 40px)',
          paddingBottom: '60px',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
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
        />

        {/* 3. DISCLAIMER */}
        <Disclaimer />

        {/* 4. CHECKLIST */}
        <ChecklistCard
          items={checklistItems}
          variant={weatherStatus}
        />

        {/* 5. CARDS ESPECÍFICOS DE CHUVA */}
        {weatherStatus === 'chuva' && (
          <>
            {protestos.length > 0 && <FinancialCard protestos={protestos} />}
            {processos.length > 0 && <JudicialCard processos={processos} />}
            {mentions.length > 0 && <WebMentionsCard mentions={mentions} />}
          </>
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
