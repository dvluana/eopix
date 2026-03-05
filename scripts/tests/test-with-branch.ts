#!/usr/bin/env node
/**
 * Roda testes E2E com banco Neon isolado
 * Uso: bun run scripts/tests/test-with-branch.ts --playwright
 *      npx tsx scripts/tests/test-with-branch.ts --playwright
 *
 * 1. Cria branch Neon com TTL 1h
 * 2. Roda: npx prisma migrate deploy na branch
 * 3. Sobe dev server na porta 3001 com DATABASE_URL da branch
 * 4. Executa Playwright
 * 5. Branch se deleta sozinha pelo TTL
 */

import { execSync, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Load env vars
const neonApiKey = process.env.NEON_API_KEY
const projectId = process.env.NEON_PROJECT_ID || 'sweet-haze-72592464'
const baseBranchId = process.env.NEON_BASE_BRANCH || undefined // Uses default branch if not set

if (!neonApiKey) {
  console.error('❌ NEON_API_KEY não configurado')
  process.exit(1)
}

// Generate branch name
const timestamp = Date.now()
const random = Math.random().toString(36).substring(2, 8)
const branchName = `e2e-${timestamp}-${random}`

console.log(`\n🔄 Iniciando testes E2E com branch Neon isolada...`)
console.log(`📦 Branch: ${branchName}`)

async function main() {
  let branchId: string | null = null
  let serverProcess: any = null

  try {
    // 1. Criar branch Neon
    console.log(`\n1️⃣  Criando branch Neon...`)
    branchId = await createNeonBranch(branchName, projectId, neonApiKey, baseBranchId)
    console.log(`✓ Branch criada: ${branchId}`)

    // 2. Obter connection string
    console.log(`\n2️⃣  Obtendo connection string...`)
    const connectionString = await getNeonConnectionString(projectId, branchId, neonApiKey)
    console.log(`✓ Connection string obtido`)

    // 3. Rodar migrations
    console.log(`\n3️⃣  Rodando migrations Prisma...`)
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log(`✓ Migrations executadas`)

    // 4. Subir servidor de teste (porta 3001)
    console.log(`\n4️⃣  Subindo servidor Next.js na porta 3001...`)
    serverProcess = await startTestServer(connectionString, 3001)
    console.log(`✓ Servidor rodando em http://localhost:3001`)

    // Wait for server to be ready
    await waitForServer('http://localhost:3001', 30000)
    console.log(`✓ Servidor pronto`)

    // 5. Rodar Playwright
    console.log(`\n5️⃣  Executando testes Playwright...`)
    execSync('npx playwright test --config e2e/playwright.config.ts', {
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        PLAYWRIGHT_TEST_BASE_URL: 'http://localhost:3001'
      },
      stdio: 'inherit',
      cwd: process.cwd()
    })

    console.log(`\n✅ Testes E2E com branch Neon concluídos com sucesso!`)
    console.log(`💡 Branch se auto-deleta em 1 hora via TTL`)
  } catch (error) {
    console.error(`\n❌ Erro:`, error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    // Kill server
    if (serverProcess) {
      console.log(`\n🛑 Encerrando servidor de teste...`)
      serverProcess.kill()
    }

    // Note: Branch se deleta sozinha via TTL, não precisa deletar manualmente
    if (branchId) {
      console.log(`\n💤 Branch ${branchId} será deletada em 1 hora via TTL`)
    }
  }
}

/**
 * Criar branch Neon via API
 */
async function createNeonBranch(
  name: string,
  projectId: string,
  apiKey: string,
  parentId?: string
): Promise<string> {
  const url = `https://api.neon.tech/api/v1/projects/${projectId}/branches`

  const body: any = {
    branch: {
      name,
      parent_id: parentId || undefined
    }
  }

  // Remove undefined fields
  if (!body.branch.parent_id) delete body.branch.parent_id

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Falha ao criar branch Neon: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as any
  return data.branch.id
}

/**
 * Obter connection string da branch
 */
async function getNeonConnectionString(
  projectId: string,
  branchId: string,
  apiKey: string
): Promise<string> {
  const url = `https://api.neon.tech/api/v1/projects/${projectId}/branches/${branchId}/connection_string`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  })

  if (!response.ok) {
    throw new Error(`Falha ao obter connection string: ${response.status}`)
  }

  const data = (await response.json()) as any
  return data.connection_string
}

/**
 * Iniciar servidor Next.js para testes
 */
function startTestServer(databaseUrl: string, port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        PORT: port.toString(),
        MOCK_MODE: 'false',
        TEST_MODE: 'true'
      },
      stdio: 'pipe',
      cwd: process.cwd()
    })

    server.stdout?.on('data', (data) => {
      const message = data.toString()
      console.log(message)
      if (message.includes('Ready in') || message.includes('compiled')) {
        resolve(server)
      }
    })

    server.stderr?.on('data', (data) => {
      console.error(data.toString())
    })

    server.on('error', reject)

    // Timeout de 60s
    setTimeout(() => {
      if (server.exitCode === null) {
        resolve(server)
      } else {
        reject(new Error('Servidor não iniciou em 60s'))
      }
    }, 60000)
  })
}

/**
 * Aguardar servidor estar pronto
 */
async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, { timeout: 5000 })
      if (response.ok) return
    } catch (e) {
      // Ignore
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Servidor não respondeu em ${timeoutMs}ms`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
