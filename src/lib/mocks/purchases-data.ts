import type { ReportData } from '@/lib/hooks/use-report-data'
import type { FinancialSummary, ProcessAnalysis, SrsPremiumCpfResponse } from '@/types/report'

import {
  MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
  MOCK_APIFULL_CPF_CADASTRAL_SOL,
  MOCK_APIFULL_CPF_PROCESSOS_CHUVA,
  MOCK_APIFULL_CPF_PROCESSOS_SOL,
  MOCK_APIFULL_CPF_FINANCIAL_CHUVA,
  MOCK_APIFULL_CPF_FINANCIAL_SOL,
  MOCK_APIFULL_CNPJ_DOSSIE_CHUVA,
  MOCK_APIFULL_CNPJ_DOSSIE_SOL,
  MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA,
  MOCK_APIFULL_CNPJ_FINANCIAL_SOL,
} from './apifull-data'

import {
  MOCK_GOOGLE_CPF_CHUVA,
  MOCK_GOOGLE_CPF_SOL,
  MOCK_GOOGLE_CHUVA,
  MOCK_GOOGLE_SOL,
} from './google-data'

import {
  MOCK_OPENAI_PROCESSOS_CHUVA,
  MOCK_OPENAI_PROCESSOS_SOL,
  MOCK_OPENAI_SUMMARY_CHUVA_CPF,
  MOCK_OPENAI_SUMMARY_SOL_CPF,
  MOCK_OPENAI_SUMMARY_CHUVA_CNPJ,
  MOCK_OPENAI_SUMMARY_SOL_CNPJ,
} from './openai-data'

// ========== Helpers ==========

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()

function buildFinancialSummary(
  financial: { totalProtestos: number; valorTotalProtestos: number; totalPendencias: number; valorTotalPendencias: number; chequesSemFundo: number; _scoreInterno: number | null },
): FinancialSummary {
  return {
    totalProtestos: financial.totalProtestos,
    valorTotalProtestos: financial.valorTotalProtestos,
    totalDividas: financial.totalPendencias,
    valorTotalDividas: financial.valorTotalPendencias,
    chequesSemFundo: financial.chequesSemFundo,
    _scoreInterno: financial._scoreInterno,
  }
}

// ========== Mock Purchases ==========

export interface MockPurchase {
  id: string
  code: string
  status: string
  processingStep: number
  type: 'CPF' | 'CNPJ'
  term: string
  createdAt: string
  hasReport: boolean
  reportId: string | null
  reportName: string | null
}

export const MOCK_PURCHASES: MockPurchase[] = [
  {
    id: 'mock-purchase-01',
    code: 'MOCK01',
    status: 'PROCESSING',
    processingStep: 3,
    type: 'CPF',
    term: '123.456.789-01',
    createdAt: hoursAgo(0.1), // ~6 minutes ago
    hasReport: false,
    reportId: null,
    reportName: null,
  },
  {
    id: 'mock-purchase-02',
    code: 'MOCK02',
    status: 'FAILED',
    processingStep: 4,
    type: 'CNPJ',
    term: '99.999.999/0001-99',
    createdAt: hoursAgo(2),
    hasReport: false,
    reportId: null,
    reportName: null,
  },
  {
    id: 'mock-purchase-03',
    code: 'MOCK03',
    status: 'REFUND_PENDING',
    processingStep: 0,
    type: 'CPF',
    term: '111.222.333-44',
    createdAt: hoursAgo(48),
    hasReport: false,
    reportId: null,
    reportName: null,
  },
  {
    id: 'mock-purchase-04',
    code: 'MOCK04',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '123.456.789-01',
    createdAt: hoursAgo(1),
    hasReport: true,
    reportId: 'mock-report-cpf-chuva',
    reportName: 'Joao Carlos da Silva',
  },
  {
    id: 'mock-purchase-05',
    code: 'MOCK05',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '987.654.321-09',
    createdAt: hoursAgo(3),
    hasReport: true,
    reportId: 'mock-report-cpf-sol',
    reportName: 'Maria Aparecida Santos',
  },
  {
    id: 'mock-purchase-06',
    code: 'MOCK06',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CNPJ',
    term: '12.345.678/0001-90',
    createdAt: hoursAgo(6),
    hasReport: true,
    reportId: 'mock-report-cnpj-chuva',
    reportName: 'EMPRESA PROBLEMATICA LTDA',
  },
  {
    id: 'mock-purchase-07',
    code: 'MOCK07',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CNPJ',
    term: '98.765.432/0001-55',
    createdAt: hoursAgo(12),
    hasReport: true,
    reportId: 'mock-report-cnpj-sol',
    reportName: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  },
  {
    id: 'mock-purchase-08',
    code: 'MOCK08',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '555.666.777-88',
    createdAt: hoursAgo(24),
    hasReport: true,
    reportId: 'mock-report-cpf-parcial',
    reportName: 'Ana Paula Ferreira',
  },
]

// ========== Mock Reports ==========

export const MOCK_REPORTS: Record<string, ReportData> = {
  'mock-report-cpf-chuva': {
    id: 'mock-report-cpf-chuva',
    term: '123.456.***-**',
    type: 'CPF',
    name: 'Joao Carlos da Silva',
    data: {
      cadastral: MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
      processos: MOCK_APIFULL_CPF_PROCESSOS_CHUVA,
      financial: MOCK_APIFULL_CPF_FINANCIAL_CHUVA,
      financialSummary: buildFinancialSummary(MOCK_APIFULL_CPF_FINANCIAL_CHUVA),
      processAnalysis: MOCK_OPENAI_PROCESSOS_CHUVA.processAnalysis as ProcessAnalysis[],
      google: MOCK_GOOGLE_CPF_CHUVA,
    },
    summary: MOCK_OPENAI_SUMMARY_CHUVA_CPF.summary,
    createdAt: hoursAgo(1),
    expiresAt: daysFromNow(7),
  },

  'mock-report-cpf-sol': {
    id: 'mock-report-cpf-sol',
    term: '987.654.***-**',
    type: 'CPF',
    name: 'Maria Aparecida Santos',
    data: {
      cadastral: MOCK_APIFULL_CPF_CADASTRAL_SOL,
      processos: MOCK_APIFULL_CPF_PROCESSOS_SOL,
      financial: MOCK_APIFULL_CPF_FINANCIAL_SOL,
      financialSummary: buildFinancialSummary(MOCK_APIFULL_CPF_FINANCIAL_SOL),
      processAnalysis: MOCK_OPENAI_PROCESSOS_SOL.processAnalysis as ProcessAnalysis[],
      google: MOCK_GOOGLE_CPF_SOL,
    },
    summary: MOCK_OPENAI_SUMMARY_SOL_CPF.summary,
    createdAt: hoursAgo(3),
    expiresAt: daysFromNow(7),
  },

  'mock-report-cnpj-chuva': {
    id: 'mock-report-cnpj-chuva',
    term: '12.345.678/****-**',
    type: 'CNPJ',
    name: 'EMPRESA PROBLEMATICA LTDA',
    data: {
      dossie: MOCK_APIFULL_CNPJ_DOSSIE_CHUVA,
      financial: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA,
      financialSummary: buildFinancialSummary(MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA),
      processAnalysis: (MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.processAnalysis || []) as ProcessAnalysis[],
      google: MOCK_GOOGLE_CHUVA,
      reclameAqui: MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.reclameAqui,
    },
    summary: MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.summary,
    createdAt: hoursAgo(6),
    expiresAt: daysFromNow(7),
  },

  'mock-report-cnpj-sol': {
    id: 'mock-report-cnpj-sol',
    term: '98.765.432/****-**',
    type: 'CNPJ',
    name: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
    data: {
      dossie: MOCK_APIFULL_CNPJ_DOSSIE_SOL,
      financial: MOCK_APIFULL_CNPJ_FINANCIAL_SOL,
      financialSummary: buildFinancialSummary(MOCK_APIFULL_CNPJ_FINANCIAL_SOL),
      processAnalysis: (MOCK_OPENAI_SUMMARY_SOL_CNPJ.processAnalysis || []) as ProcessAnalysis[],
      google: MOCK_GOOGLE_SOL,
      reclameAqui: MOCK_OPENAI_SUMMARY_SOL_CNPJ.reclameAqui,
    },
    summary: MOCK_OPENAI_SUMMARY_SOL_CNPJ.summary,
    createdAt: hoursAgo(12),
    expiresAt: daysFromNow(7),
  },

  'mock-report-cpf-parcial': {
    id: 'mock-report-cpf-parcial',
    term: '555.666.***-**',
    type: 'CPF',
    name: 'Ana Paula Ferreira',
    data: {
      financial: {
        nome: 'Ana Paula Ferreira',
        protestos: [
          {
            data: '2025-10-05',
            valor: 3000,
            cartorio: '1o Cartorio de Protestos',
            cidade: 'Curitiba',
            uf: 'PR',
          },
          {
            data: '2026-01-15',
            valor: 2000,
            cartorio: '2o Cartorio de Protestos',
            cidade: 'Curitiba',
            uf: 'PR',
          },
        ],
        pendenciasFinanceiras: [],
        chequesSemFundo: 0,
        totalProtestos: 2,
        valorTotalProtestos: 5000,
        totalPendencias: 0,
        valorTotalPendencias: 0,
        _scoreInterno: 620,
      } as SrsPremiumCpfResponse,
      financialSummary: {
        totalProtestos: 2,
        valorTotalProtestos: 5000,
        totalDividas: 0,
        valorTotalDividas: 0,
        chequesSemFundo: 0,
        _scoreInterno: 620,
      },
      processos: {
        processos: [],
        totalProcessos: 0,
      },
      google: {
        byDocument: [],
        byName: [],
        reclameAqui: [],
      },
    },
    summary: 'Foram encontrados 2 protestos em cartorio totalizando R$ 5.000. Sem processos judiciais ou mencoes negativas na web.',
    createdAt: hoursAgo(24),
    expiresAt: daysFromNow(7),
  },
}
