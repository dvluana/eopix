import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  consultCpfCadastral,
  consultCpfProcessos,
  consultCpfFinancial,
  consultCnpjDossie,
  consultCnpjFinancial,
} from '@/lib/apifull'
import { searchWeb } from '@/lib/google-search'
import { analyzeProcessos, analyzeMentionsAndSummary } from '@/lib/openai'
import { calculateCpfFinancialSummary, calculateCnpjFinancialSummary } from '@/lib/financial-summary'
import { isBypassMode } from '@/lib/mock-mode'
import type {
  CpfCadastralResponse,
  ProcessosCpfResponse,
  SrsPremiumCpfResponse,
  DossieResponse,
  SrsPremiumCnpjResponse,
  GoogleSearchResponse,
  ProcessAnalysis,
  FinancialSummary,
} from '@/types/report'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Só funciona em bypass mode (MOCK_MODE ou TEST_MODE)
  if (!isBypassMode) {
    return NextResponse.json(
      { error: 'Endpoint apenas para bypass mode' },
      { status: 403 }
    )
  }

  console.log(`🧪 [BYPASS] Processamento manual iniciado para code: ${code}`)

  try {
    // Buscar purchase pelo code
    const purchase = await prisma.purchase.findUnique({
      where: { code: code.toUpperCase() },
      include: { user: true },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase não encontrada' },
        { status: 404 }
      )
    }

    if (purchase.searchResultId) {
      return NextResponse.json({
        message: 'Purchase já processada',
        searchResultId: purchase.searchResultId,
        reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/relatorio/${purchase.searchResultId}`,
      })
    }

    const term = purchase.term
    const type = term.length === 11 ? 'CPF' : 'CNPJ'

    // Update to PROCESSING
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: 'PROCESSING' },
    })

    console.log(`🧪 [BYPASS] Buscando dados para ${type}: ${term}`)

    // Variables para armazenar dados
    let cadastralData: CpfCadastralResponse | null = null
    let processosData: ProcessosCpfResponse | null = null
    let cpfFinancialData: SrsPremiumCpfResponse | null = null
    let dossieData: DossieResponse | null = null
    let cnpjFinancialData: SrsPremiumCnpjResponse | null = null
    let googleData: GoogleSearchResponse | null = null
    let processAnalysis: ProcessAnalysis[] = []
    let financialSummary: FinancialSummary
    let name = ''
    let region = ''

    // ========== CPF: 3 chamadas APIFull ==========
    if (type === 'CPF') {
      console.log(`🧪 [BYPASS] Consultando APIFull CPF (cadastral)...`)
      cadastralData = await consultCpfCadastral(term)
      name = cadastralData.nome
      region = cadastralData.enderecos?.[0]?.uf || ''
      console.log(`🧪 [BYPASS] CPF Cadastral: nome=${name}, região=${region}`)

      console.log(`🧪 [BYPASS] Consultando APIFull CPF (financeiro + processos em paralelo)...`)
      const [financialData, processosResult] = await Promise.all([
        consultCpfFinancial(term).catch((err) => {
          console.error('🧪 [BYPASS] CPF Financial error:', err)
          return null
        }),
        consultCpfProcessos(term).catch((err) => {
          console.error('🧪 [BYPASS] CPF Processos error:', err)
          return { processos: [], totalProcessos: 0 } as ProcessosCpfResponse
        }),
      ])

      cpfFinancialData = financialData
      processosData = processosResult

      if (cpfFinancialData) {
        console.log(`🧪 [BYPASS] CPF Financial: ${cpfFinancialData.totalProtestos} protestos, ${cpfFinancialData.totalPendencias} pendências`)
      }
      console.log(`🧪 [BYPASS] CPF Processos: ${processosData.totalProcessos} processos`)

      // Calcular resumo financeiro (sem IA)
      financialSummary = calculateCpfFinancialSummary(cpfFinancialData)
    }
    // ========== CNPJ: 2 chamadas APIFull ==========
    else {
      console.log(`🧪 [BYPASS] Consultando APIFull CNPJ (dossiê)...`)
      dossieData = await consultCnpjDossie(term)
      name = dossieData.razaoSocial
      region = dossieData.endereco?.uf || ''
      console.log(`🧪 [BYPASS] CNPJ Dossiê: razaoSocial=${name}, situação=${dossieData.situacao}`)

      console.log(`🧪 [BYPASS] Consultando APIFull CNPJ (financeiro)...`)
      cnpjFinancialData = await consultCnpjFinancial(term).catch((err) => {
        console.error('🧪 [BYPASS] CNPJ Financial error:', err)
        return null
      })

      if (cnpjFinancialData) {
        console.log(`🧪 [BYPASS] CNPJ Financial: ${cnpjFinancialData.totalProtestos} protestos, ${cnpjFinancialData.totalPendencias} pendências`)
      }

      // Calcular resumo financeiro (sem IA)
      financialSummary = calculateCnpjFinancialSummary(cnpjFinancialData)
    }

    // Busca na web (Serper)
    console.log(`🧪 [BYPASS] Buscando na web (Serper)...`)
    googleData = await searchWeb(name, term, type).catch((err) => {
      console.error('🧪 [BYPASS] Google/Serper error:', err)
      return { byDocument: [], byName: [], reclameAqui: [] }
    })

    console.log(`🧪 [BYPASS] Web: byDocument=${googleData.byDocument.length}, byName=${googleData.byName.length}, reclameAqui=${googleData.reclameAqui.length}`)

    // ========== IA 1: Analisar processos (se houver) ==========
    if (type === 'CPF' && processosData && processosData.processos.length > 0) {
      console.log(`🧪 [BYPASS] Analisando processos com IA...`)
      const processosResult = await analyzeProcessos(processosData.processos, term)
      processAnalysis = processosResult.processAnalysis
      console.log(`🧪 [BYPASS] IA Processos: ${processAnalysis.length} analisados`)
    }

    // ========== IA 2: Analisar menções e gerar resumo ==========
    console.log(`🧪 [BYPASS] Gerando resumo com IA...`)
    const mentions = [
      ...(googleData.byDocument || []),
      ...(googleData.byName || []),
      ...(googleData.reclameAqui || []),
    ]

    const summaryResult = await analyzeMentionsAndSummary({
      mentions,
      financialSummary,
      processAnalysis,
      type,
      region,
    }, term)

    console.log(`🧪 [BYPASS] Resumo gerado com sucesso`)

    // Aplicar classificações nos resultados do Google
    if (googleData && summaryResult.mentionClassifications) {
      for (const classification of summaryResult.mentionClassifications) {
        const matchByDoc = googleData.byDocument.find((r) => r.url === classification.url)
        if (matchByDoc) matchByDoc.classification = classification.classification

        const matchByName = googleData.byName.find((r) => r.url === classification.url)
        if (matchByName) matchByName.classification = classification.classification

        const matchRA = googleData.reclameAqui.find((r) => r.url === classification.url)
        if (matchRA) matchRA.classification = classification.classification
      }
    }

    // Salvar SearchResult
    console.log(`🧪 [BYPASS] Salvando SearchResult...`)
    const dataToSave = type === 'CPF'
      ? {
          cadastral: cadastralData,
          processos: processosData,
          financial: cpfFinancialData,
          financialSummary,
          processAnalysis,
          google: googleData,
          reclameAqui: summaryResult.reclameAqui || null,
        }
      : {
          dossie: dossieData,
          financial: cnpjFinancialData,
          financialSummary,
          google: googleData,
          reclameAqui: summaryResult.reclameAqui || null,
        }

    const jsonData = JSON.parse(JSON.stringify(dataToSave)) as Prisma.InputJsonValue

    const searchResult = await prisma.searchResult.create({
      data: {
        term,
        type,
        name,
        data: jsonData,
        summary: summaryResult.summary,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // Update purchase to COMPLETED
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'COMPLETED',
        searchResultId: searchResult.id,
      },
    })

    console.log(`🧪 [BYPASS] Purchase completada! SearchResult ID: ${searchResult.id}`)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      success: true,
      searchResultId: searchResult.id,
      reportUrl: `${appUrl}/relatorio/${searchResult.id}`,
    })
  } catch (error) {
    console.error('🧪 [BYPASS] Process search error:', error)

    // Update purchase to FAILED
    const purchase = await prisma.purchase.findUnique({
      where: { code: code.toUpperCase() },
    })
    if (purchase) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'FAILED' },
      })
    }

    return NextResponse.json(
      { error: 'Erro ao processar consulta', details: String(error) },
      { status: 500 }
    )
  }
}
