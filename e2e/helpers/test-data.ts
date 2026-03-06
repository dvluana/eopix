/**
 * Valid CPFs/CNPJs with correct check digits for E2E tests.
 * Last digit determines Chuva (0-4) vs Sol (5-9) scenario in mock mode.
 */

export const TEST_CPFS = {
  /** Last digit 0 → Chuva: processos, protestos, pendências */
  chuva: '52998224130',
  /** Last digit 5 → Sol: histórico limpo */
  sol: '11144477735',
} as const

export const TEST_CNPJS = {
  /** Last digit 1 → Chuva: processos, menções negativas */
  chuva: '11222333000181',
  /** Last digit 5 → Sol: registro limpo */
  sol: '11222333000505',
} as const

export const TEST_EMAIL = 'e2e-test@eopix.test'

export const TEST_USER = {
  name: 'E2E Test User',
  email: 'e2e-test@eopix.test',
  password: 'E2eTestPass!2026',
  cellphone: '11999999999',
  taxId: '52998224725',
} as const

export const ADMIN_CREDENTIALS = {
  email: 'e2e-admin@eopix.test',
  password: 'E2eAdminPass!2026',
  name: 'E2E Admin',
} as const
