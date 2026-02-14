import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { createSession } from './auth'

/**
 * Cria um novo usuário admin no banco de dados
 * @param email Email do admin
 * @param password Senha em texto plano (será convertida em hash)
 * @param name Nome do admin (opcional)
 * @returns true se criado com sucesso, false se email já existe ou senha inválida
 */
export async function createAdminUser(
  email: string,
  password: string,
  name?: string
): Promise<boolean> {
  // Validar senha (mínimo 8 caracteres)
  if (password.length < 8) {
    return false
  }

  // Hash da senha com bcrypt (10 rounds)
  const passwordHash = await bcrypt.hash(password, 10)

  // Criar usuário no banco
  try {
    await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name: name || null
      }
    })
    return true
  } catch (error) {
    // Email já existe (violação de constraint unique)
    return false
  }
}

/**
 * Verifica as credenciais de um admin
 * @param email Email do admin
 * @param password Senha em texto plano
 * @returns true se credenciais válidas, false caso contrário
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  // Buscar admin no banco
  const admin = await prisma.adminUser.findUnique({
    where: { email, active: true }
  })

  if (!admin) {
    return false
  }

  // Verificar senha com bcrypt
  return await bcrypt.compare(password, admin.passwordHash)
}
