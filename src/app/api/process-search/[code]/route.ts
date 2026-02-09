import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { consultCpf, consultCpfCadastral, consultCnpj as consultCnpjApiFull, consultCnpjFinancial, ApiFullCpfCadastralResponse, ApiFullCnpjFinancialResponse } from '@/lib/apifull'
import { consultCnpj as consultCnpjBrasilApi } from '@/lib/brasilapi'
import { searchDatajud } from '@/lib/datajud'
import { searchWeb } from '@/lib/google-search'
import { generateSummary } from '@/lib/openai'
import { sendReportReady } from '@/lib/resend'

// TEST_MODE: Endpoint de processamento manual para testes
// TODO: Remover ou proteger em produção
const TEST_MODE = process.env.TEST_MODE === 'true'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Só funciona em TEST_MODE
  if (!TEST_MODE) {
    return NextResponse.json(
      { error: 'Endpoint disponível apenas em TEST_MODE' },
      { status: 403 }
    )
  }

  console.log(`🧪 [TEST_MODE] Processamento manual iniciado para code: ${code}`)

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
    const email = purchase.user.email

    // Update to PROCESSING
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: 'PROCESSING' },
    })

    console.log(`🧪 [TEST_MODE] Buscando dados para ${type}: ${term}`)

    // Fetch data from APIs
    let apiFullData: Awaited<ReturnType<typeof consultCpf>> | Awaited<ReturnType<typeof consultCnpjApiFull>> | null = null
    let cadastralCpfData: ApiFullCpfCadastralResponse | null = null
    let cnpjFinancialData: ApiFullCnpjFinancialResponse | null = null
    let brasilApiData: Awaited<ReturnType<typeof consultCnpjBrasilApi>> | null = null
    let datajudData: Awaited<ReturnType<typeof searchDatajud>> | null = null
    let googleData: Awaited<ReturnType<typeof searchWeb>> | null = null
    let name = ''
    let region = ''

    // Step 1: Get primary data from APIFull
    if (type === 'CPF') {
      console.log(`🧪 [TEST_MODE] Consultando APIFull CPF (cadastral + financeiro em paralelo)...`)
      // Buscar dados cadastrais e financeiros em paralelo
      const [cadastralData, financialData] = await Promise.all([
        consultCpfCadastral(term),
        consultCpf(term),  // e-boavista
      ])

      apiFullData = financialData
      cadastralCpfData = cadastralData
      name = cadastralData.nome || financialData.name
      region = cadastralData.enderecos?.[0]?.uf || financialData.region
      console.log(`🧪 [TEST_MODE] APIFull CPF: nome=${name}, região=${region}`)
    } else {
      console.log(`🧪 [TEST_MODE] Consultando BrasilAPI CNPJ...`)
      try {
        brasilApiData = await consultCnpjBrasilApi(term)
        name = brasilApiData.razaoSocial
        console.log(`🧪 [TEST_MODE] BrasilAPI CNPJ: razaoSocial=${name}`)
      } catch (err) {
        console.error(`🧪 [TEST_MODE] BrasilAPI error (will use APIFull):`, err)
        brasilApiData = null
      }

      console.log(`🧪 [TEST_MODE] Consultando APIFull CNPJ (cadastral + financeiro em paralelo)...`)
      // CNPJ: Buscar dados cadastrais (api/cnpj) e financeiros (e-boavista) em paralelo
      const [cadastralData, financialData] = await Promise.all([
        consultCnpjApiFull(term),
        consultCnpjFinancial(term).catch((err) => {
          console.error('🧪 [TEST_MODE] CNPJ Financial (e-boavista) error:', err)
          return null
        }),
      ])

      apiFullData = cadastralData
      cnpjFinancialData = financialData

      // Use APIFull as fallback if BrasilAPI failed
      if (!name && apiFullData) {
        name = (apiFullData as Awaited<ReturnType<typeof consultCnpjApiFull>>).razaoSocial
      }
      region = (apiFullData as Awaited<ReturnType<typeof consultCnpjApiFull>>).region

      if (cnpjFinancialData) {
        console.log(`🧪 [TEST_MODE] CNPJ Financial: ${cnpjFinancialData.totalProtests} protestos, ${cnpjFinancialData.totalDebts} dívidas, situação=${cnpjFinancialData.situacao}`)
      }
    }

    // Step 2: Parallel fetches - Datajud (multi-tribunal) e Google
    console.log(`🧪 [TEST_MODE] Buscando Datajud (multi-tribunal) e Web em paralelo...`)
    const [datajud, google] = await Promise.all([
      searchDatajud(name, term).catch((err) => {
        console.error('🧪 [TEST_MODE] Datajud error:', err)
        return { processes: [] }
      }),
      searchWeb(name, term, type).catch((err) => {
        console.error('🧪 [TEST_MODE] Google/Serper error:', err)
        return { general: [], focused: [], reclameAqui: [] }
      }),
    ])

    datajudData = datajud
    googleData = google

    console.log(`🧪 [TEST_MODE] Datajud: ${datajudData.processes.length} processos (multi-tribunal)`)
    console.log(`🧪 [TEST_MODE] Web: ${googleData.general.length} menções gerais, ${googleData.reclameAqui.length} Reclame Aqui`)

    // Processos já vêm deduplicados do Datajud (multi-tribunal)
    const uniqueProcesses = (datajudData?.processes || []).map((p) => ({
      ...p,
      source: 'datajud' as const,
    }))

    console.log(`🧪 [TEST_MODE] Total processos: ${uniqueProcesses.length}`)

    // Step 4: Generate summary with GPT
    console.log(`🧪 [TEST_MODE] Gerando resumo com OpenAI...`)
    const combinedData = {
      apiFull: apiFullData,
      cadastral: cadastralCpfData,
      brasilApi: brasilApiData,
      processes: uniqueProcesses,
      google: googleData,
    }

    const summaryResult = await generateSummary(combinedData, type, region, term)
    console.log(`🧪 [TEST_MODE] Resumo gerado com sucesso`)

    // Apply classifications to Google results
    if (googleData && summaryResult.mentionClassifications) {
      for (const classification of summaryResult.mentionClassifications) {
        const matchGeneral = googleData.general.find((r) => r.url === classification.url)
        if (matchGeneral) matchGeneral.classification = classification.classification

        const matchFocused = googleData.focused.find((r) => r.url === classification.url)
        if (matchFocused) matchFocused.classification = classification.classification
      }
    }

    // Step 5: Save SearchResult
    console.log(`🧪 [TEST_MODE] Salvando SearchResult...`)
    const jsonData = JSON.parse(JSON.stringify({
      apiFull: apiFullData,
      cadastral: cadastralCpfData,
      cnpjFinancial: cnpjFinancialData,
      brasilApi: brasilApiData,
      processes: uniqueProcesses,
      google: googleData,
    })) as Prisma.InputJsonValue

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

    // Step 6: Update purchase to COMPLETED
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'COMPLETED',
        searchResultId: searchResult.id,
      },
    })

    console.log(`🧪 [TEST_MODE] Purchase completada! SearchResult ID: ${searchResult.id}`)

    // Step 7: Send email notification (will be bypassed in TEST_MODE by resend.ts)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const maskedTerm = type === 'CPF'
      ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
      : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**')

    await sendReportReady(
      email,
      maskedTerm,
      `${appUrl}/relatorio/${searchResult.id}`
    )

    return NextResponse.json({
      success: true,
      searchResultId: searchResult.id,
      reportUrl: `${appUrl}/relatorio/${searchResult.id}`,
    })
  } catch (error) {
    console.error('🧪 [TEST_MODE] Process search error:', error)

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
