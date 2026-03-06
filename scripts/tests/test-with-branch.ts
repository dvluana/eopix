#!/usr/bin/env node
/**
 * Roda testes E2E com banco Neon isolado
 * Uso: bun run scripts/tests/test-with-branch.ts --playwright
 *      npx tsx scripts/tests/test-with-branch.ts --playwright
 *
 * 1. Cria branch Neon com compute endpoint (retorna connection_uri)
 * 2. Roda: npx prisma migrate deploy na branch
 * 3. Sobe dev server na porta 3001 com DATABASE_URL da branch
 * 4. Executa Playwright
 * 5. Branch se deleta sozinha pelo TTL (ou cleanup CI)
 */

import { execSync, spawn } from 'child_process'

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
    // 1. Criar branch Neon (retorna connection string junto)
    console.log(`\n1️⃣  Criando branch Neon com compute endpoint...`)
    const { branchId: id, connectionUri } = await createNeonBranch(branchName, projectId, neonApiKey, baseBranchId)
    branchId = id
    console.log(`✓ Branch criada: ${branchId}`)
    console.log(`✓ Connection URI obtido`)
    const connectionString = connectionUri

    // 2. Rodar migrations
    console.log(`\n2️⃣  Rodando migrations Prisma...`)
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log(`✓ Migrations executadas`)

    // 3. Subir servidor de teste (porta 3001)
    console.log(`\n3️⃣  Subindo servidor Next.js na porta 3001...`)
    serverProcess = await startTestServer(connectionString, 3001)
    console.log(`✓ Servidor rodando em http://localhost:3001`)

    // Wait for server to be ready (120s for CI cold start)
    await waitForServer('http://localhost:3001', 120000)
    console.log(`✓ Servidor pronto`)

    // 4. Rodar Playwright
    console.log(`\n4️⃣  Executando testes Playwright...`)
    execSync('npx playwright test --config e2e/playwright.config.ts', {
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        BASE_URL: 'http://localhost:3001'
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
 * Criar branch Neon via API v2
 * Includes a read_write compute endpoint so connection_uris are returned directly.
 */
async function createNeonBranch(
  name: string,
  projectId: string,
  apiKey: string,
  parentId?: string
): Promise<{ branchId: string; connectionUri: string }> {
  const url = `https://console.neon.tech/api/v2/projects/${projectId}/branches`

  const body: Record<string, unknown> = {
    endpoints: [{ type: 'read_write' }],
    branch: {
      name,
      ...(parentId ? { parent_id: parentId } : {})
    }
  }

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
  const branchId: string = data.branch.id
  const connectionUri: string = data.connection_uris?.[0]?.connection_uri

  if (!connectionUri) {
    throw new Error(`Branch criada (${branchId}) mas connection_uri não retornado. Verifique se o compute endpoint foi criado.`)
  }

  return { branchId, connectionUri }
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
        MOCK_MODE: process.env.MOCK_MODE || 'false',
        TEST_MODE: process.env.TEST_MODE || 'true',
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
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
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
