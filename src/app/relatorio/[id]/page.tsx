"use client"

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import UserNav from '@/components/UserNav';
import Footer from '@/components/Footer';
import {
  DossierHeader,
  WeatherVerdict,
  AiSummary,
  QuickScan,
  DossierSection,
  DossierFooter,
  Disclaimer,
  LimitedDataWarning,
  PersonInfoCard,
  CompanyInfoCard,
  FinancialCard,
  JudicialCard,
  ProcessAnalysisCard,
  WebMentionsCard,
  ReclameAquiCard,
} from '@/components/relatorio';
import { useReportData } from '@/lib/hooks/use-report-data';

export default function Page() {
  const params = useParams();
  const reportId = params.id as string;
  const router = useRouter();
  const { report, loading, error, userEmail, derived } = useReportData(reportId);

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
    window.open(`mailto:plataforma@somoseopix.com.br?subject=${subject}&body=${body}`);
  };

  const handleVoltarConsultas = () => {
    router.push('/minhas-consultas');
  };

  // Loading state
  if (loading) {
    return (
      <div className="rel">
        <nav className="nav" aria-label="Menu principal">
          <div className="nav__inner">
            <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
              <LogoFundoPreto />
            </Link>
          </div>
        </nav>
        <main className="rel__main">
          <button type="button" onClick={handleVoltarConsultas} className="btn btn--ghost rel__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Minhas Consultas
          </button>
          <div className="rel__loading">
            <div className="rel__spinner" />
            <p className="rel__loading-text">Carregando relatório...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !report || !derived) {
    return (
      <div className="rel">
        <nav className="nav" aria-label="Menu principal">
          <div className="nav__inner">
            <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
              <LogoFundoPreto />
            </Link>
          </div>
        </nav>
        <main className="rel__main">
          <button type="button" onClick={handleVoltarConsultas} className="btn btn--ghost rel__back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Minhas Consultas
          </button>
          <div className="rel__error-card">
            <p className="rel__error-title">Oops!</p>
            <p className="rel__error-message">
              {error || 'Não foi possível carregar o relatório.'}
            </p>
            <button type="button" onClick={handleVoltarConsultas} className="btn btn--primary rel__error-btn">
              Voltar para Minhas Consultas
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const {
    cadastral,
    financialSummary,
    dossie,
    reclameAqui,
    processAnalysis,
    weatherStatus,
    totalOccurrences,
    hasLimitedData,
    hasProtests,
    hasDebts,
    hasBouncedChecks,
    checklistItems,
    protestosCard,
    dividas,
    totalProtestosValor,
    totalDividasValor,
    processosCard,
    negativeMentions,
    positiveMentions,
    closingMessage,
    formattedCreatedAt,
    formattedExpiresAt,
  } = derived;

  return (
    <div className="rel">
      {/* NAV */}
      <nav className="nav" aria-label="Menu principal">
        <div className="nav__inner">
          <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
            <LogoFundoPreto />
          </Link>
          <UserNav email={userEmail} showLogout onLogout={handleLogout} />
        </div>
      </nav>

      <main className="rel__main">
        {/* Back button */}
        <button type="button" onClick={handleVoltarConsultas} className="btn btn--ghost rel__back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Minhas Consultas
        </button>

        {/* 1. DOSSIER HEADER */}
        <DossierHeader
          term={report.term}
          type={report.type}
          name={report.name}
          createdAt={formattedCreatedAt}
        />

        {/* 2. WEATHER VERDICT */}
        <WeatherVerdict
          weatherStatus={weatherStatus}
          totalOccurrences={totalOccurrences}
          closingMessage={closingMessage}
        />

        {/* 3. AI SUMMARY */}
        <AiSummary summary={report.summary} />

        {/* 4. LIMITED DATA WARNING */}
        {hasLimitedData && <LimitedDataWarning />}

        {/* 5. QUICK SCAN */}
        <QuickScan items={checklistItems} />

        {/* 6. DISCLAIMER */}
        <Disclaimer />

        {/* 7. CADASTRAL DATA */}
        <DossierSection num="01" title="Dados Cadastrais" defaultExpanded>
          {report.type === 'CPF' && cadastral && (
            <PersonInfoCard cadastral={{
              nome: cadastral.nome,
              idade: cadastral.idade,
              situacaoRF: cadastral.situacaoRF,
              enderecos: cadastral.enderecos || [],
              telefones: cadastral.telefones || [],
              emails: cadastral.emails || [],
              empresasVinculadas: cadastral.empresasVinculadas || [],
            }} />
          )}
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
        </DossierSection>

        {/* 8. FINANCIAL */}
        <DossierSection num="02" title="Situacao Financeira" defaultExpanded={weatherStatus === 'chuva'}>
          {(protestosCard.length > 0 || dividas.length > 0 || hasBouncedChecks) ? (
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
          ) : (
            <p className="rel__section-empty">Nenhuma ocorrencia financeira encontrada.</p>
          )}
        </DossierSection>

        {/* 9. JUDICIAL */}
        <DossierSection num="03" title="Processos Judiciais" defaultExpanded={weatherStatus === 'chuva'}>
          {processosCard.length > 0 ? (
            <>
              <JudicialCard processos={processosCard} />
              {processAnalysis.length > 0 && <ProcessAnalysisCard analyses={processAnalysis} />}
            </>
          ) : (
            <p className="rel__section-empty">Nenhum processo judicial encontrado.</p>
          )}
        </DossierSection>

        {/* 10. WEB & REPUTATION */}
        <DossierSection num="04" title="Web e Reputacao" defaultExpanded={weatherStatus === 'chuva'}>
          {/* Reclame Aqui */}
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
          {/* Negative mentions */}
          {negativeMentions.length > 0 && <WebMentionsCard mentions={negativeMentions} />}
          {/* Positive/neutral mentions */}
          {positiveMentions.length > 0 && (
            <>
              <h3 className="rel__positive-title" style={{ margin: '1.5rem 0 0.5rem', fontSize: '0.95rem' }}>
                <span>&#10024;</span> Outras mencoes &mdash; {positiveMentions.length} encontrada{positiveMentions.length > 1 ? 's' : ''}
              </h3>
              <WebMentionsCard mentions={positiveMentions} variant="sol" />
            </>
          )}
          {/* Empty state */}
          {!reclameAqui && negativeMentions.length === 0 && positiveMentions.length === 0 && (
            <p className="rel__section-empty">Nenhuma mencao encontrada na web.</p>
          )}
        </DossierSection>

        {/* 11. FOOTER */}
        <DossierFooter
          createdAt={formattedCreatedAt}
          expiresAt={formattedExpiresAt}
          onBack={handleVoltarConsultas}
          onReportError={handleRelatarErro}
        />
      </main>

      <Footer />
    </div>
  );
}
