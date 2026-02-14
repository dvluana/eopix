import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'
import readline from 'readline'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)

const prisma = new PrismaClient({ adapter })

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  console.log('=== Criar Usuário Admin ===\n')

  const email = await promptUser('Email do admin: ')
  const name = await promptUser('Nome (opcional): ')
  const password = await promptUser('Senha (mínimo 8 caracteres): ')

  if (password.length < 8) {
    console.error('❌ Senha deve ter no mínimo 8 caracteres')
    process.exit(1)
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const admin = await prisma.adminUser.create({
      data: {
        email,
        name: name || null,
        passwordHash
      }
    })

    console.log('\n✅ Admin criado com sucesso!')
    console.log(`   Email: ${admin.email}`)
    console.log(`   ID: ${admin.id}`)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      console.error('\n❌ Email já existe no sistema')
    } else {
      console.error('\n❌ Erro ao criar admin:', error)
    }
    process.exit(1)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
