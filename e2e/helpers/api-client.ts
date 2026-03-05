/**
 * Typed fetch helpers for EOPIX API endpoints.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

interface ApiResponse<T = unknown> {
  ok: boolean
  status: number
  data: T
}

async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({})) as T

  return { ok: res.ok, status: res.status, data }
}

// --- Health ---

interface HealthResponse {
  status: string
  mode: string
  paymentProvider: string
}

export function getHealth() {
  return apiCall<HealthResponse>('/api/health')
}

// --- Validate Document ---

interface ValidateResponse {
  valid: boolean
  type: string
  term: string
  formattedDocument: string
  error?: string
}

export function validateDocument(document: string) {
  return apiCall<ValidateResponse>('/api/search/validate', {
    method: 'POST',
    body: JSON.stringify({ document }),
  })
}

// --- Purchases ---

interface CreatePurchaseResponse {
  code: string
  checkoutUrl: string
  _bypassMode?: boolean
  error?: string
}

export function createPurchase(term: string, email?: string) {
  return apiCall<CreatePurchaseResponse>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify({ term, ...(email && { email }), termsAccepted: true }),
  })
}

// --- Admin: Mark Paid ---

interface MarkPaidResponse {
  success: boolean
  message: string
  error?: string
}

export function markPaid(purchaseId: string, adminCookie: string) {
  return apiCall<MarkPaidResponse>(
    `/api/admin/purchases/${purchaseId}/mark-paid`,
    {
      method: 'POST',
      headers: { Cookie: adminCookie },
    }
  )
}

// --- Process Search (sync fallback) ---

interface ProcessSearchResponse {
  success: boolean
  searchResultId: string
  reportUrl: string
  error?: string
}

export function processSearch(code: string) {
  return apiCall<ProcessSearchResponse>(`/api/process-search/${code}`, {
    method: 'POST',
  })
}

// --- Get Purchase by Code ---

interface PurchaseResponse {
  code: string
  status: string
  reportId: string | null
  hasReport: boolean
  term: string
  type: string
  email: string
  error?: string
}

export function getPurchase(code: string) {
  return apiCall<PurchaseResponse>(`/api/purchases/${code}`)
}

// --- Admin: List Purchases (to get ID from code) ---

interface AdminPurchase {
  id: string
  code: string
  status: string
  reportId: string | null
}

interface AdminPurchasesResponse {
  purchases: AdminPurchase[]
}

export function adminFindPurchaseByCode(code: string, adminCookie: string) {
  return apiCall<AdminPurchasesResponse>(
    `/api/admin/purchases?search=${code}&limit=1`,
    { headers: { Cookie: adminCookie } }
  )
}

// --- Admin Login ---

interface AdminLoginResponse {
  success: boolean
  error?: string
}

export function adminLogin(
  email: string,
  password: string
): Promise<ApiResponse<AdminLoginResponse> & { cookie?: string }> {
  return fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  }).then(async (res) => {
    const data = (await res.json().catch(() => ({}))) as AdminLoginResponse
    const setCookie = res.headers.get('set-cookie')
    const cookie = setCookie
      ? setCookie
          .split(',')
          .map((c) => c.split(';')[0].trim())
          .join('; ')
      : undefined
    return { ok: res.ok, status: res.status, data, cookie }
  })
}
