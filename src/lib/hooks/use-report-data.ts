"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  sortProcessesByGravity,
  sortFinancialByValue,
  sortMentionsByClassification,
  generateProcessDetail,
  generateFinancialDetail,
} from '@/lib/report-utils'
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
  WeatherStatus,
} from '@/types/report'

// ========== Types ==========

export interface ReportData {
  id: string
  term: string
  type: 'CPF' | 'CNPJ'
  name: string
  data: {
    cadastral?: CpfCadastralResponse
    processos?: ProcessosCpfResponse
    financial?: SrsPremiumCpfResponse | SrsPremiumCnpjResponse
    dossie?: DossieResponse
    financialSummary?: FinancialSummary
    processAnalysis?: ProcessAnalysis[]
    google?: GoogleSearchResponse
    reclameAqui?: ReclameAquiData
  }
  summary: string
  createdAt: string
  expiresAt: string
}

export interface ChecklistItem {
  label: string
  detail: string
  status: 'ok' | 'warning'
}

export interface FormattedProtesto {
  data: string
  valor: string
  cartorio: string
}

export interface FormattedDivida {
  tipo: string
  valor: string
  origem: string
}

export interface FormattedProcesso {
  tribunal: string
  data: string
  classe: string
  polo: 'reu' | 'autor' | 'testemunha'
}

export interface FormattedMention {
  fonte: string
  data: string
  resumo: string
  url: string
  classification: 'negative'
}

export interface PositiveMention {
  fonte: string
  resumo: string
  url: string
}

// ========== Helpers ==========

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

// ========== Hook ==========

export function useReportData(reportId: string) {
  const router = useRouter()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')

  // Fetch report + session
  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/report/${reportId}`)
        if (!response.ok) {
          const data = await response.json()
          if (response.status === 401) {
            router.push(`/login?redirect=/relatorio/${reportId}`)
            return
          }
          throw new Error(data.error || 'Erro ao carregar relatório')
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserEmail(data.email || '')
        }
      } catch {
        // Ignore session fetch errors
      }
    }

    fetchReport()
    fetchSession()
  }, [reportId, router])

  // Derived/transformed data (memoized)
  const derived = useMemo(() => {
    if (!report) return null

    const { cadastral, financial, financialSummary, processos, dossie, google, reclameAqui } = report.data
    const processAnalysis = report.data.processAnalysis || []

    // Process count
    const processCount = processos?.totalProcessos || 0

    // Weather status flags
    const hasProtests = (financialSummary?.totalProtestos || 0) > 0
    const hasDebts = (financialSummary?.totalDividas || 0) > 0
    const hasBouncedChecks = (financialSummary?.chequesSemFundo || 0) > 0
    const hasProcesses = processCount > 0 || (dossie?.acoesAtivas?.quantidade || 0) > 0
    const allMentions = [...(google?.byDocument || []), ...(google?.byName || [])]
    const hasNegativeMentions = allMentions.some(m => m.classification === 'negative')
    const isCompanyInactive = report.type === 'CNPJ' && dossie != null && dossie.situacao !== 'ATIVA'
    const hasNegativeReclameAqui = reclameAqui != null && reclameAqui.nota !== null && reclameAqui.nota < 7

    const weatherStatus: WeatherStatus =
      (hasProtests || hasDebts || hasBouncedChecks || hasProcesses || hasNegativeMentions || isCompanyInactive || hasNegativeReclameAqui)
        ? 'chuva'
        : 'sol'

    // Total occurrences
    const totalOccurrences =
      (financialSummary?.totalProtestos || 0) +
      (financialSummary?.totalDividas || 0) +
      (hasBouncedChecks ? financialSummary?.chequesSemFundo || 0 : 0) +
      processCount +
      (dossie?.acoesAtivas?.quantidade || 0) +
      allMentions.filter(m => m.classification === 'negative').length +
      (isCompanyInactive ? 1 : 0) +
      (hasNegativeReclameAqui ? 1 : 0)

    // Limited data check
    const hasLimitedData = !cadastral?.nome && !dossie?.razaoSocial && processCount === 0 && allMentions.length === 0

    // Processes for detail
    const processesForDetail = processos?.processos?.map(p => ({
      tribunal: p.tribunal,
      date: p.dataAutuacao,
      classe: p.classeProcessual?.nome || '',
      polo: p.partes?.find(part => part.nome.toLowerCase().includes(report.name.toLowerCase()))?.polo === 'PASSIVO' ? 'reu' : 'autor',
    })) || []

    // Checklist items
    const checklistItems: ChecklistItem[] = []

    if (hasProtests || hasDebts) {
      const financialDetail = generateFinancialDetail(
        { count: financialSummary?.totalProtestos || 0, totalAmount: financialSummary?.valorTotalProtestos || 0 },
        { count: financialSummary?.totalDividas || 0, totalAmount: financialSummary?.valorTotalDividas || 0 },
        financialSummary?.chequesSemFundo || 0,
      )
      checklistItems.push({ label: 'Situação financeira', detail: financialDetail, status: 'warning' })
    } else {
      checklistItems.push({ label: 'Situação financeira', detail: 'Sem protestos ou dívidas', status: 'ok' })
    }

    if (hasProcesses) {
      checklistItems.push({ label: 'Processos judiciais', detail: generateProcessDetail(processesForDetail), status: 'warning' })
    } else {
      checklistItems.push({ label: 'Processos judiciais', detail: 'Nenhum encontrado', status: 'ok' })
    }

    if (hasNegativeMentions) {
      const negativeCount = allMentions.filter(m => m.classification === 'negative').length
      checklistItems.push({
        label: 'Menções na web',
        detail: `${negativeCount} ocorrência${negativeCount > 1 ? 's' : ''} negativa${negativeCount > 1 ? 's' : ''}`,
        status: 'warning',
      })
    } else {
      checklistItems.push({ label: 'Menções na web', detail: 'Nenhuma ocorrência negativa', status: 'ok' })
    }

    if (report.type === 'CNPJ' && dossie) {
      checklistItems.push({
        label: 'Cadastro empresarial',
        detail: dossie.situacao === 'ATIVA'
          ? `Ativo${dossie.dataAbertura ? ` desde ${new Date(dossie.dataAbertura).getFullYear()}` : ''}`
          : dossie.situacao || 'Verificar situação',
        status: dossie.situacao === 'ATIVA' ? 'ok' : 'warning',
      })
    }

    // Formatted financial data
    const protestosFormatted = (financial?.protestos || []).map(p => ({
      data: formatDateOnly(p.data),
      valor: formatCurrency(p.valor),
      cartorio: p.cartorio,
    }))
    const protestosCard = sortFinancialByValue(protestosFormatted) as FormattedProtesto[]

    const dividasFormatted = (financial?.pendenciasFinanceiras || []).map(d => ({
      tipo: d.tipo,
      valor: formatCurrency(d.valor),
      origem: d.origem,
    }))
    const dividas = sortFinancialByValue(dividasFormatted) as FormattedDivida[]

    const totalProtestosValor = financialSummary?.valorTotalProtestos ? formatCurrency(financialSummary.valorTotalProtestos) : undefined
    const totalDividasValor = financialSummary?.valorTotalDividas ? formatCurrency(financialSummary.valorTotalDividas) : undefined

    // Sorted processes
    const sortedProcesses = sortProcessesByGravity(processesForDetail)
    const processosCard: FormattedProcesso[] = sortedProcesses.map(p => ({
      tribunal: p.tribunal,
      data: formatDateOnly(p.date),
      classe: p.classe,
      polo: (p.polo?.toLowerCase() === 'reu' || p.polo?.toLowerCase() === 'réu')
        ? 'reu' as const
        : p.polo?.toLowerCase() === 'testemunha'
          ? 'testemunha' as const
          : 'autor' as const,
    }))

    // Sorted mentions
    const sortedMentions = sortMentionsByClassification(allMentions)

    const negativeMentions: FormattedMention[] = sortedMentions
      .filter(m => m.classification === 'negative')
      .map(m => ({
        fonte: new URL(m.url).hostname.replace('www.', ''),
        data: '',
        resumo: m.snippet || m.title,
        url: m.url,
        classification: 'negative' as const,
      }))

    const positiveMentions: PositiveMention[] = sortedMentions
      .filter(m => m.classification === 'positive' || m.classification === 'neutral')
      .map(m => ({
        fonte: new URL(m.url).hostname.replace('www.', ''),
        resumo: m.snippet || m.title,
        url: m.url,
      }))

    const climateMessage = weatherStatus === 'sol'
      ? 'Céu limpo. Nenhuma ocorrência encontrada.'
      : undefined

    const closingMessage = weatherStatus === 'sol'
      ? 'Pelo que encontramos, o céu está limpo. Boa parceria!'
      : 'Encontramos pontos de atenção. Avalie com cuidado.'

    return {
      cadastral,
      financial,
      financialSummary,
      processos,
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
      climateMessage,
      closingMessage,
      formattedCreatedAt: formatDate(report.createdAt),
      formattedExpiresAt: formatDateOnly(report.expiresAt),
    }
  }, [report])

  return { report, loading, error, userEmail, derived }
}
