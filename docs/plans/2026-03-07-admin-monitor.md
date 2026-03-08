# Admin Pipeline Monitor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) Improve the existing purchase details dialog with stuck detection, elapsed timers, and a retry button so stuck purchases are immediately actionable. (2) Add a real-time pipeline monitoring dashboard at `/admin/monitor` that shows all active processing, queue, failures, and completions at a glance via SSE.

**Architecture:** The details dialog gets stuck detection logic (>5 min on same step = "possibly stuck" warning with retry button) and elapsed time display. The monitor page connects to an SSE endpoint (`/api/admin/monitor/stream`) that polls the DB every 3s and streams purchase processing state in 4 groups: active (PROCESSING), queued (PAID), failed (last 24h), completed (last 1h). No new DB tables — reads existing Purchase fields (`status`, `processingStep`, `failureReason`, `failureDetails`, `updatedAt`).

**Tech Stack:** Next.js 14 App Router, SSE (ReadableStream), Prisma, Lucide icons, existing admin CSS classes (`adm-card`, `adm-badge`, etc.)

---

## Existing Patterns to Follow

- **SSE pattern**: `src/app/api/purchases/stream/route.ts` — ReadableStream + setInterval + heartbeat + abort handler
- **Admin auth**: `requireAdmin(request)` from `@/lib/auth` — returns `NextResponse` if unauthorized
- **Admin page structure**: `src/app/admin/(protected)/health/page.tsx` — loading/error states, auto-refresh, `AdminPageHeader`, `AdminError`
- **Processing steps**: `src/types/domain.ts` — `PROCESSING_STEPS` constant (6 steps with labels)
- **Sidebar nav**: `src/app/admin/_components/AdminSidebar.tsx` — `navItems` array with `{ href, label, icon }`
- **Status badges**: `src/app/admin/_components/StatusBadge.tsx`
- **Admin styles**: `src/styles/admin.css` — uses `adm-` prefix for all classes
- **Details dialog**: `src/app/admin/_components/PurchaseDetailsDialog.tsx` — polls `/api/admin/purchases/{id}/details` every 1s when PROCESSING
- **Details API**: `src/app/api/admin/purchases/[id]/details/route.ts` — returns `processingStep`, `processingLogs[]`, `failureReason`, `failureDetails`
- **Process action**: `src/app/api/admin/purchases/[id]/process/route.ts` — POST triggers Inngest `search/process`

---

### Task 1: Improve PurchaseDetailsDialog — Stuck Detection + Timer + Retry

**Files:**
- Modify: `src/app/admin/_components/PurchaseDetailsDialog.tsx`
- Modify: `src/styles/admin.css` (append stuck-related styles)

The current dialog polls every 1s but shows no indication when processing is stuck. We add:
1. **Elapsed timer** — shows how long each step has been running (since `paidAt`)
2. **Stuck detection** — if PROCESSING for >5 min, show yellow warning banner with "Possivelmente travado"
3. **Retry button** — calls `POST /api/admin/purchases/{id}/process` to re-trigger Inngest
4. **updatedAt tracking** — API already returns `updatedAt` implicitly via `purchase`, we need to add it to the response

**Step 1: Update the details API to include `updatedAt`**

In `src/app/api/admin/purchases/[id]/details/route.ts`, add `updatedAt` to the response object (line 55, after `paidAt`):

```typescript
// Add after paidAt: purchase.paidAt, (line 55)
        updatedAt: purchase.updatedAt,
```

**Step 2: Update PurchaseDetailsDialog with stuck detection + timer + retry**

Replace the full contents of `src/app/admin/_components/PurchaseDetailsDialog.tsx`:

```tsx
'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Clock, RotateCcw } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate } from './admin-utils'

interface Purchase {
  id: string
  code: string
  term: string
  type: string
  status: string
  amount: number
  email: string
  failureReason: string | null
  failureDetails: string | null
  refundReason: string | null
  refundDetails: string | null
  createdAt: string
  paidAt: string | null
}

interface ProcessingLog {
  step: number
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface PurchaseDetails {
  purchase: Purchase & { processingStep?: number; updatedAt?: string }
  processingLogs: ProcessingLog[]
}

const STUCK_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

function getFailureMessage(reason: string | null): string {
  const messages: Record<string, string> = {
    PAYMENT_RISK: 'Reprovado por analise de risco',
    PROCESSING_ERROR: 'Erro durante processamento',
    PROCESSING_TIMEOUT: 'Processamento excedeu 4 horas',
    PAYMENT_EXPIRED: 'Pagamento nao confirmado em 30min',
  }
  return reason ? (messages[reason] || reason) : 'Motivo nao registrado'
}

function getRefundMessage(reason: string | null): string {
  const messages: Record<string, string> = {
    MANUAL_ADMIN: 'Reembolso manual (admin)',
  }
  return reason ? (messages[reason] || reason) : 'Motivo nao registrado'
}

function ElapsedTimer({ since }: { since: string }) {
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
  if (seconds < 0) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const h = Math.floor(m / 60)

  let text: string
  if (h > 0) text = `${h}h ${m % 60}m ${s}s`
  else if (m > 0) text = `${m}m ${s}s`
  else text = `${s}s`

  return (
    <span className="adm-elapsed">
      <Clock size={12} />
      {text}
    </span>
  )
}

interface PurchaseDetailsDialogProps {
  purchase: Purchase | null
  onClose: () => void
  onListRefresh: () => void
}

export function PurchaseDetailsDialog({ purchase, onClose, onListRefresh }: PurchaseDetailsDialogProps) {
  const [data, setData] = React.useState<PurchaseDetails | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [retrying, setRetrying] = React.useState(false)
  const [retryMessage, setRetryMessage] = React.useState<string | null>(null)

  // Fetch details when purchase changes
  React.useEffect(() => {
    if (!purchase) { setData(null); return }
    setLoading(true)
    setRetryMessage(null)
    fetch(`/api/admin/purchases/${purchase.id}/details`)
      .then((res) => res.ok ? res.json() : null)
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [purchase?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling for PROCESSING status
  React.useEffect(() => {
    if (!purchase || !['PROCESSING', 'PAID'].includes(purchase.status)) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/purchases/${purchase.id}/details`)
        if (res.ok) {
          const d = await res.json()
          setData(d)
          if (d.purchase.status === 'COMPLETED' || d.purchase.status === 'FAILED') {
            onListRefresh()
          }
        }
      } catch {
        // ignore fetch errors during polling
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [purchase?.id, purchase?.status, onListRefresh])

  // Stuck detection
  const isStuck = React.useMemo(() => {
    if (!data) return false
    if (data.purchase.status !== 'PROCESSING') return false
    const ref = data.purchase.updatedAt || data.purchase.paidAt
    if (!ref) return false
    return Date.now() - new Date(ref).getTime() > STUCK_THRESHOLD_MS
  }, [data])

  const handleRetry = async () => {
    if (!purchase) return
    setRetrying(true)
    setRetryMessage(null)
    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}/process`, { method: 'POST' })
      if (res.ok) {
        setRetryMessage('Reprocessamento iniciado')
        onListRefresh()
      } else {
        const err = await res.json()
        setRetryMessage(err.error || 'Erro ao reprocessar')
      }
    } catch {
      setRetryMessage('Erro de conexao')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Dialog open={!!purchase} onOpenChange={() => onClose()}>
      <DialogContent style={{ maxWidth: '560px' }}>
        <DialogHeader>
          <DialogTitle>Detalhes da Compra {purchase?.code}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="adm-loading"><RefreshCw className="animate-spin" size={24} /></div>
        ) : data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stuck Warning */}
            {isStuck && (
              <div className="adm-stuck-banner">
                <AlertTriangle size={18} />
                <div className="adm-stuck-banner__content">
                  <p className="adm-stuck-banner__title">Possivelmente travado</p>
                  <p className="adm-stuck-banner__desc">
                    Processamento parado ha mais de 5 minutos no step {data.purchase.processingStep || '?'}.
                    O Inngest pode ter falhado silenciosamente.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="adm-stuck-banner__btn"
                >
                  <RotateCcw size={14} />
                  {retrying ? 'Reenviando...' : 'Reprocessar'}
                </Button>
              </div>
            )}

            {retryMessage && (
              <p className="adm-retry-message">{retryMessage}</p>
            )}

            {/* Info Grid */}
            <div className="adm-detail-grid">
              <div>
                <p className="adm-detail-label">Documento</p>
                <p className="adm-detail-value">{data.purchase.term} ({data.purchase.type})</p>
              </div>
              <div>
                <p className="adm-detail-label">Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status={data.purchase.status} />
                  {data.purchase.status === 'PROCESSING' && data.purchase.paidAt && (
                    <ElapsedTimer since={data.purchase.paidAt} />
                  )}
                </div>
              </div>
              <div>
                <p className="adm-detail-label">Email</p>
                <p className="adm-detail-value">{data.purchase.email}</p>
              </div>
              <div>
                <p className="adm-detail-label">Valor</p>
                <p className="adm-detail-value">{formatCurrency(data.purchase.amount)}</p>
              </div>
            </div>

            {/* Processing Progress */}
            {['PROCESSING', 'PAID'].includes(data.purchase.status) && (
              <div>
                <div className="adm-progress__header">
                  <p className="adm-progress__title">Progresso do Processamento</p>
                  {data.purchase.status === 'PROCESSING' && data.purchase.paidAt && (
                    <ElapsedTimer since={data.purchase.paidAt} />
                  )}
                </div>
                <div className="adm-progress">
                  {data.processingLogs.map((log) => (
                    <div key={log.step} className="adm-progress-step">
                      <div className={`adm-progress-circle adm-progress-circle--${log.status}`}>
                        {log.status === 'completed' ? '\u2713' : log.status === 'in_progress' ? '...' : log.step}
                      </div>
                      <span className={`adm-progress-step__label${log.status === 'pending' ? ' adm-progress-step__label--pending' : ''}`}>
                        {log.label}
                      </span>
                      {log.status === 'in_progress' && (
                        <RefreshCw className="animate-spin" size={12} style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Retry button when not stuck but PROCESSING */}
                {data.purchase.status === 'PROCESSING' && !isStuck && (
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRetry}
                      disabled={retrying}
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px' }} />
                      {retrying ? 'Reenviando...' : 'Forcar reprocessamento'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Failure/Refund Reason */}
            {['FAILED', 'REFUNDED', 'REFUND_FAILED'].includes(data.purchase.status) && (
              <div className="adm-alert-box">
                <p className="adm-alert-box__title">
                  {data.purchase.status === 'FAILED' && 'Motivo da Falha'}
                  {data.purchase.status === 'REFUNDED' && 'Motivo do Reembolso'}
                  {data.purchase.status === 'REFUND_FAILED' && 'Falha no Reembolso'}
                </p>

                {data.purchase.failureReason && (
                  <p className="adm-alert-box__text">{getFailureMessage(data.purchase.failureReason)}</p>
                )}

                {data.purchase.refundReason && (
                  <p className="adm-alert-box__text">{getRefundMessage(data.purchase.refundReason)}</p>
                )}

                {data.purchase.failureDetails && (
                  <details className="adm-alert-box__details">
                    <summary>Ver detalhes tecnicos</summary>
                    <pre>
                      {(() => { try { return JSON.stringify(JSON.parse(data.purchase.failureDetails), null, 2) } catch { return data.purchase.failureDetails } })()}
                    </pre>
                  </details>
                )}

                {data.purchase.refundDetails && (
                  <details className="adm-alert-box__details">
                    <summary>Ver detalhes do reembolso</summary>
                    <pre>
                      {(() => { try { return JSON.stringify(JSON.parse(data.purchase.refundDetails), null, 2) } catch { return data.purchase.refundDetails } })()}
                    </pre>
                  </details>
                )}

                {/* Retry button for FAILED purchases */}
                {data.purchase.status === 'FAILED' && (
                  <div style={{ marginTop: '12px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetry}
                      disabled={retrying}
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px' }} />
                      {retrying ? 'Reenviando...' : 'Tentar reprocessar'}
                    </Button>
                    {retryMessage && <span className="adm-retry-message" style={{ marginLeft: '8px' }}>{retryMessage}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="adm-timeline">
              <p className="adm-timeline__title">Timeline</p>
              <div className="adm-timeline__items">
                <p>Criado: {formatDate(data.purchase.createdAt)}</p>
                {data.purchase.paidAt && <p>Pago: {formatDate(data.purchase.paidAt)}</p>}
                {data.purchase.status === 'COMPLETED' && <p>Concluido: Relatorio gerado</p>}
                {data.purchase.status === 'FAILED' && <p style={{ color: 'var(--primitive-red-500)' }}>Falhou</p>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Add stuck banner + elapsed timer styles**

Append to `src/styles/admin.css`:

```css
/* ===== Stuck Detection (PurchaseDetailsDialog) ===== */

.adm-stuck-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #b45309;
}

.adm-stuck-banner__content {
  flex: 1;
}

.adm-stuck-banner__title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.adm-stuck-banner__desc {
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.4;
}

.adm-stuck-banner__btn {
  flex-shrink: 0;
}

.adm-elapsed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: 3px;
}

.adm-retry-message {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-style: italic;
}

.adm-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
```

**Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Commit**

```bash
git add src/app/admin/_components/PurchaseDetailsDialog.tsx src/app/api/admin/purchases/\[id\]/details/route.ts src/styles/admin.css
git commit -m "feat(admin): stuck detection, elapsed timer, and retry in purchase details dialog"
```

---

### Task 2: Admin Monitor SSE API Endpoint

**Files:**
- Create: `src/app/api/admin/monitor/stream/route.ts`

**Step 1: Write the SSE endpoint**

```typescript
// src/app/api/admin/monitor/stream/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDocument } from '@/lib/validators'

interface MonitorPurchase {
  id: string
  code: string
  term: string
  termFormatted: string
  type: 'CPF' | 'CNPJ'
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

interface MonitorData {
  active: MonitorPurchase[]    // PROCESSING
  queued: MonitorPurchase[]    // PAID (waiting for Inngest pickup)
  failed: MonitorPurchase[]    // FAILED in last 24h
  completed: MonitorPurchase[] // COMPLETED in last 1h
  timestamp: string
}

const SELECT_FIELDS = {
  id: true,
  code: true,
  term: true,
  status: true,
  processingStep: true,
  buyerName: true,
  failureReason: true,
  failureDetails: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
} as const

function mapPurchase(p: {
  id: string
  code: string
  term: string
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
}): MonitorPurchase {
  const cleaned = p.term.replace(/\D/g, '')
  return {
    id: p.id,
    code: p.code,
    term: p.term,
    termFormatted: formatDocument(p.term),
    type: cleaned.length <= 11 ? 'CPF' : 'CNPJ',
    status: p.status,
    processingStep: p.processingStep,
    buyerName: p.buyerName,
    failureReason: p.failureReason,
    failureDetails: p.failureDetails,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(': heartbeat\n\n'))

      const fetchAndSend = async () => {
        try {
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

          const [active, queued, failed, completed] = await Promise.all([
            prisma.purchase.findMany({
              where: { status: 'PROCESSING' },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 50,
            }),
            prisma.purchase.findMany({
              where: { status: 'PAID' },
              select: SELECT_FIELDS,
              orderBy: { paidAt: 'desc' },
              take: 20,
            }),
            prisma.purchase.findMany({
              where: {
                status: 'FAILED',
                updatedAt: { gte: oneDayAgo },
              },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 20,
            }),
            prisma.purchase.findMany({
              where: {
                status: 'COMPLETED',
                updatedAt: { gte: oneHourAgo },
              },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 10,
            }),
          ])

          const data: MonitorData = {
            active: active.map(mapPurchase),
            queued: queued.map(mapPurchase),
            failed: failed.map(mapPurchase),
            completed: completed.map(mapPurchase),
            timestamp: now.toISOString(),
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error('[Monitor SSE] Error:', error)
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        }
      }

      await fetchAndSend()
      intervalId = setInterval(fetchAndSend, 3000)

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    },
    cancel() {
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit 2>&1 | grep "monitor/stream" | head -5`
Expected: No errors related to the new file.

**Step 3: Commit**

```bash
git add src/app/api/admin/monitor/stream/route.ts
git commit -m "feat(admin): add monitor SSE endpoint for real-time pipeline tracking"
```

---

### Task 3: Add Monitor to Sidebar Navigation

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx:7-26`

**Step 1: Add Monitor nav item**

In `AdminSidebar.tsx`, add `Radio` to the lucide imports and add the nav item after Health:

```typescript
// Add Radio to imports (line 7-18):
import {
  LayoutDashboard,
  ShieldBan,
  Activity,
  ShoppingCart,
  Users,
  LogOut,
  FileSearch,
  Menu,
  X,
  ChevronsLeft,
  Radio,        // ADD
} from 'lucide-react'

// Update navItems (line 20-26):
const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/compras', label: 'Compras', icon: ShoppingCart },
  { href: '/admin/blocklist', label: 'Blocklist', icon: ShieldBan },
  { href: '/admin/health', label: 'Health', icon: Activity },
  { href: '/admin/monitor', label: 'Monitor', icon: Radio },   // ADD
  { href: '/admin/leads', label: 'Leads', icon: Users },
]
```

**Step 2: Verify the sidebar compiles**

Run: `npx tsc --noEmit 2>&1 | grep -i "sidebar" | head -5`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat(admin): add Monitor to sidebar navigation"
```

---

### Task 4: Monitor Page — UI Component

**Files:**
- Create: `src/app/admin/(protected)/monitor/page.tsx`

**Step 1: Create the monitor page**

```tsx
// src/app/admin/(protected)/monitor/page.tsx
'use client'

import React from 'react'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminError } from '../../_components/AdminError'
import { formatDate } from '../../_components/admin-utils'
import { PROCESSING_STEPS } from '@/types/domain'

// -- Types --

interface MonitorPurchase {
  id: string
  code: string
  term: string
  termFormatted: string
  type: 'CPF' | 'CNPJ'
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

interface MonitorData {
  active: MonitorPurchase[]
  queued: MonitorPurchase[]
  failed: MonitorPurchase[]
  completed: MonitorPurchase[]
  timestamp: string
}

// -- Subcomponents --

function StepProgress({ step }: { step: number }) {
  return (
    <div className="adm-monitor__steps">
      {PROCESSING_STEPS.map((s) => {
        const isDone = step > s.step
        const isCurrent = step === s.step
        return (
          <div
            key={s.step}
            className={`adm-monitor__step ${isDone ? 'adm-monitor__step--done' : ''} ${isCurrent ? 'adm-monitor__step--current' : ''}`}
            title={s.label}
          >
            <div className="adm-monitor__step-dot">
              {isDone ? (
                <CheckCircle size={14} />
              ) : isCurrent ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <span className="adm-monitor__step-num">{s.step}</span>
              )}
            </div>
            <span className="adm-monitor__step-label">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function TimeSince({ date }: { date: string }) {
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return <span>{seconds}s</span>
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return <span>{minutes}m {seconds % 60}s</span>
  const hours = Math.floor(minutes / 60)
  return <span>{hours}h {minutes % 60}m</span>
}

function FailureDetails({ purchase }: { purchase: MonitorPurchase }) {
  const [open, setOpen] = React.useState(false)

  let parsedDetails: Record<string, unknown> | null = null
  if (purchase.failureDetails) {
    try {
      parsedDetails = JSON.parse(purchase.failureDetails)
    } catch {
      // raw string fallback
    }
  }

  return (
    <div className="adm-monitor__failure">
      <div className="adm-monitor__failure-header">
        <div className="adm-monitor__failure-info">
          <code className="adm-monitor__code">{purchase.code}</code>
          <span className="adm-monitor__type-badge">{purchase.type}</span>
          <span className="adm-monitor__term">{purchase.termFormatted}</span>
          {purchase.buyerName && (
            <span className="adm-monitor__name">{purchase.buyerName}</span>
          )}
        </div>
        <div className="adm-monitor__failure-meta">
          <span className="adm-badge adm-badge--failed">
            {purchase.failureReason || 'UNKNOWN'}
          </span>
          <span className="adm-monitor__time">
            <TimeSince date={purchase.updatedAt} /> atras
          </span>
          {purchase.failureDetails && (
            <button
              className="adm-monitor__expand-btn"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Recolher' : 'Expandir'}
            >
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>
      {open && purchase.failureDetails && (
        <pre className="adm-monitor__error-details">
          {parsedDetails
            ? JSON.stringify(parsedDetails, null, 2)
            : purchase.failureDetails}
        </pre>
      )}
    </div>
  )
}

// -- Main Component --

export default function MonitorPage() {
  const [data, setData] = React.useState<MonitorData | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  const connect = React.useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/admin/monitor/stream')
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const parsed: MonitorData = JSON.parse(event.data)
        setData(parsed)
        setConnected(true)
        setError(null)
      } catch {
        // heartbeat or malformed — ignore
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      // Reconnect after 5s
      setTimeout(connect, 5000)
    }
  }, [])

  React.useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  if (error && !data) {
    return <AdminError message={error} onRetry={connect} />
  }

  const totalActive = (data?.active.length ?? 0) + (data?.queued.length ?? 0)

  return (
    <div>
      <AdminPageHeader
        title="Pipeline Monitor"
        subtitle="Processamento em tempo real"
      >
        <div className="adm-monitor__header-status">
          <span
            className={`adm-monitor__connection ${connected ? 'adm-monitor__connection--live' : 'adm-monitor__connection--off'}`}
          >
            <span className="adm-monitor__connection-dot" />
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
          {data && (
            <span className="adm-monitor__last-update">
              {formatDate(data.timestamp)}
            </span>
          )}
        </div>
      </AdminPageHeader>

      {/* Summary cards */}
      <div className="adm-monitor__summary">
        <div className="adm-monitor__summary-card">
          <Zap size={20} style={{ color: '#f59e0b' }} />
          <div>
            <p className="adm-monitor__summary-value">{data?.active.length ?? 0}</p>
            <p className="adm-monitor__summary-label">Processando</p>
          </div>
        </div>
        <div className="adm-monitor__summary-card">
          <Clock size={20} style={{ color: '#3b82f6' }} />
          <div>
            <p className="adm-monitor__summary-value">{data?.queued.length ?? 0}</p>
            <p className="adm-monitor__summary-label">Na fila</p>
          </div>
        </div>
        <div className="adm-monitor__summary-card">
          <XCircle size={20} style={{ color: '#ef4444' }} />
          <div>
            <p className="adm-monitor__summary-value">{data?.failed.length ?? 0}</p>
            <p className="adm-monitor__summary-label">Falhas (24h)</p>
          </div>
        </div>
        <div className="adm-monitor__summary-card">
          <CheckCircle size={20} style={{ color: '#22c55e' }} />
          <div>
            <p className="adm-monitor__summary-value">{data?.completed.length ?? 0}</p>
            <p className="adm-monitor__summary-label">Concluidos (1h)</p>
          </div>
        </div>
      </div>

      {/* Active processing */}
      <div className="adm-card" style={{ marginBottom: '20px' }}>
        <div className="adm-card__header">
          <p className="adm-card__title">
            <Loader2 size={16} className={totalActive > 0 ? 'animate-spin' : ''} style={{ marginRight: '8px', display: 'inline' }} />
            Processando Agora
          </p>
        </div>
        <div className="adm-card__body">
          {!data || data.active.length === 0 ? (
            <div className="adm-empty">
              <p>Nenhum relatorio sendo processado</p>
            </div>
          ) : (
            <div className="adm-monitor__active-list">
              {data.active.map((p) => (
                <div key={p.id} className="adm-monitor__active-item">
                  <div className="adm-monitor__active-header">
                    <div className="adm-monitor__active-info">
                      <code className="adm-monitor__code">{p.code}</code>
                      <span className="adm-monitor__type-badge">{p.type}</span>
                      <span className="adm-monitor__term">{p.termFormatted}</span>
                      {p.buyerName && (
                        <span className="adm-monitor__name">{p.buyerName}</span>
                      )}
                    </div>
                    <span className="adm-monitor__time">
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      <TimeSince date={p.paidAt || p.createdAt} />
                    </span>
                  </div>
                  <StepProgress step={p.processingStep} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Queued (PAID, waiting for Inngest) */}
      {data && data.queued.length > 0 && (
        <div className="adm-card" style={{ marginBottom: '20px' }}>
          <div className="adm-card__header">
            <p className="adm-card__title">
              <Clock size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Fila ({data.queued.length})
            </p>
          </div>
          <div className="adm-card__body">
            <div className="adm-monitor__queue-list">
              {data.queued.map((p) => (
                <div key={p.id} className="adm-monitor__queue-item">
                  <div className="adm-monitor__queue-info">
                    <code className="adm-monitor__code">{p.code}</code>
                    <span className="adm-monitor__type-badge">{p.type}</span>
                    <span className="adm-monitor__term">{p.termFormatted}</span>
                  </div>
                  <div className="adm-monitor__queue-meta">
                    <span className="adm-badge adm-badge--paid">PAID</span>
                    <span className="adm-monitor__time">
                      aguardando <TimeSince date={p.paidAt || p.createdAt} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent failures */}
      <div className="adm-card" style={{ marginBottom: '20px' }}>
        <div className="adm-card__header">
          <p className="adm-card__title">
            <AlertCircle size={16} style={{ marginRight: '8px', display: 'inline', color: '#ef4444' }} />
            Falhas Recentes (24h)
          </p>
        </div>
        <div className="adm-card__body">
          {!data || data.failed.length === 0 ? (
            <div className="adm-empty">
              <CheckCircle size={32} style={{ color: '#22c55e', marginBottom: '8px' }} />
              <p>Nenhuma falha nas ultimas 24h</p>
            </div>
          ) : (
            <div className="adm-monitor__failure-list">
              {data.failed.map((p) => (
                <FailureDetails key={p.id} purchase={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent completions */}
      <div className="adm-card">
        <div className="adm-card__header">
          <p className="adm-card__title">
            <CheckCircle size={16} style={{ marginRight: '8px', display: 'inline', color: '#22c55e' }} />
            Concluidos Recentemente (1h)
          </p>
        </div>
        <div className="adm-card__body">
          {!data || data.completed.length === 0 ? (
            <div className="adm-empty">
              <p>Nenhuma conclusao na ultima hora</p>
            </div>
          ) : (
            <table className="adm-table adm-table--mono">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Tempo</th>
                </tr>
              </thead>
              <tbody>
                {data.completed.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.code}</code></td>
                    <td><span className="adm-monitor__type-badge">{p.type}</span></td>
                    <td>{p.termFormatted}</td>
                    <td className="adm-monitor__time">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit 2>&1 | grep "monitor" | head -10`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/admin/\(protected\)/monitor/page.tsx
git commit -m "feat(admin): add pipeline monitor page with SSE real-time updates"
```

---

### Task 5: Monitor Page CSS Styles

**Files:**
- Modify: `src/styles/admin.css` (append new styles at end)

**Step 1: Add monitor styles**

Append to the end of `src/styles/admin.css`:

```css
/* ===== Pipeline Monitor ===== */

.adm-monitor__header-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.adm-monitor__connection {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 4px 10px;
  border-radius: 4px;
}

.adm-monitor__connection--live {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.adm-monitor__connection--off {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.adm-monitor__connection-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: monitor-pulse 2s ease-in-out infinite;
}

.adm-monitor__connection--off .adm-monitor__connection-dot {
  animation: none;
}

@keyframes monitor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.adm-monitor__last-update {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

/* Summary cards */
.adm-monitor__summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.adm-monitor__summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.adm-monitor__summary-value {
  font-size: 24px;
  font-weight: 800;
  font-family: var(--font-mono);
  line-height: 1;
}

.adm-monitor__summary-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

/* Active processing items */
.adm-monitor__active-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.adm-monitor__active-item {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-primary);
}

.adm-monitor__active-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.adm-monitor__active-info,
.adm-monitor__failure-info,
.adm-monitor__queue-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.adm-monitor__code {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: 3px;
}

.adm-monitor__type-badge {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--color-text-accent);
  color: var(--primitive-black-900);
}

.adm-monitor__term {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.adm-monitor__name {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.adm-monitor__time {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
}

/* Step progress */
.adm-monitor__steps {
  display: flex;
  gap: 4px;
}

.adm-monitor__step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.adm-monitor__step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  color: var(--color-text-tertiary);
  font-size: 11px;
  font-family: var(--font-mono);
  transition: all 0.3s ease;
}

.adm-monitor__step--done .adm-monitor__step-dot {
  background: #22c55e;
  border-color: #22c55e;
  color: white;
}

.adm-monitor__step--current .adm-monitor__step-dot {
  background: var(--color-text-accent);
  border-color: var(--color-text-accent);
  color: var(--primitive-black-900);
}

.adm-monitor__step-num {
  font-weight: 700;
}

.adm-monitor__step-label {
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-align: center;
  line-height: 1.2;
  max-width: 80px;
}

.adm-monitor__step--done .adm-monitor__step-label,
.adm-monitor__step--current .adm-monitor__step-label {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Queue items */
.adm-monitor__queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adm-monitor__queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.adm-monitor__queue-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Failure items */
.adm-monitor__failure-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.adm-monitor__failure {
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.adm-monitor__failure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.adm-monitor__failure-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.adm-monitor__expand-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 2px 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.adm-monitor__expand-btn:hover {
  background: var(--color-bg-secondary);
}

.adm-monitor__error-details {
  margin: 0;
  padding: 12px;
  background: var(--primitive-black-900);
  color: #e2e8f0;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 300px;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .adm-monitor__summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .adm-monitor__steps {
    flex-wrap: wrap;
  }

  .adm-monitor__step-label {
    display: none;
  }

  .adm-monitor__active-header,
  .adm-monitor__failure-header,
  .adm-monitor__queue-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

**Step 2: Verify no regressions**

Run: `npx tsc --noEmit`
Expected: Clean compile.

**Step 3: Commit**

```bash
git add src/styles/admin.css
git commit -m "style(admin): add pipeline monitor CSS styles"
```

---

### Task 6: Verify & Test End-to-End

**Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 2: Run linter**

Run: `npm run lint`
Expected: Clean (or only pre-existing warnings).

**Step 3: Run vitest**

Run: `npx vitest run`
Expected: All existing tests pass.

**Step 4: Manual test — Details Dialog improvements**

Run: `npm run dev`

1. Go to `/admin/compras`
2. Find a PROCESSING or PAID purchase (or create one via mark-paid-and-process)
3. Click details → verify:
   - Elapsed timer shows next to status badge (e.g., "2m 34s")
   - Progress steps animate correctly
   - "Forcar reprocessamento" ghost button at bottom of progress section
4. Wait 5+ minutes (or temporarily change `STUCK_THRESHOLD_MS` to 10000 for testing) → verify:
   - Yellow "Possivelmente travado" banner appears
   - "Reprocessar" button in banner works
5. Check a FAILED purchase details → verify:
   - "Tentar reprocessar" button appears in failure box
   - Clicking it shows success/error message

**Step 5: Manual test — Monitor page**

1. Navigate to Monitor in sidebar → page loads, shows "LIVE" pulsing dot
2. Verify SSE connection in DevTools Network tab → `stream` request, `text/event-stream`
3. Verify summary cards show correct counts
4. If active purchases: verify step progress dots update in real-time
5. If failed purchases: verify expandable error details work
6. Test reconnection: disable network briefly → "OFFLINE" appears → re-enable → reconnects

**Step 6: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(admin): monitor page adjustments from manual testing"
```

---

### Task 7: Update docs/status.md

**Files:**
- Modify: `docs/status.md`

**Step 1: Add entries to status.md**

Add to "O que esta funcionando" section:
```
- **Admin Pipeline Monitor** — Pagina `/admin/monitor` com SSE real-time (3s polling). Mostra: processamento ativo com progresso por step (6 etapas), fila PAID aguardando Inngest, falhas das ultimas 24h com detalhes de erro expandiveis, concluidos na ultima hora. Indicador LIVE/OFFLINE, cards de resumo, responsivo mobile.
- **Purchase details stuck detection** — Dialog de detalhes detecta purchases travadas (>5min sem mudanca de step), mostra banner amarelo "Possivelmente travado" com botao de reprocessar. Timer elapsed mostra tempo desde pagamento. Botao retry disponivel para PROCESSING e FAILED.
```

Add to "Ultimas mudancas":
```
- **Admin Pipeline Monitor + Stuck Detection** (2026-03-07): (1) PurchaseDetailsDialog melhorado: deteccao de travamento (>5min sem mudanca), banner amarelo com botao reprocessar, timer elapsed desde pagamento, botao retry para PROCESSING e FAILED. (2) SSE endpoint `GET /api/admin/monitor/stream` (admin auth, 3s polling, 4 queries paralelas: PROCESSING + PAID + FAILED 24h + COMPLETED 1h). (3) Pagina `/admin/monitor` com EventSource, reconexao automatica, indicador LIVE/OFFLINE pulsante. (4) Processamento ativo: cards com progress dots por step (6 etapas). (5) Fila: PAID aguardando pickup Inngest. (6) Falhas: detalhes expandiveis (JSON formatado). (7) Concluidos: tabela mono ultima hora. (8) Sidebar: item "Monitor" com icone Radio. tsc clean, lint clean.
```

**Step 2: Commit**

```bash
git add docs/status.md
git commit -m "docs: add admin pipeline monitor and stuck detection to status"
```

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| Modify | `src/app/admin/_components/PurchaseDetailsDialog.tsx` | Stuck detection, elapsed timer, retry button |
| Modify | `src/app/api/admin/purchases/[id]/details/route.ts` | Add `updatedAt` to response |
| Create | `src/app/api/admin/monitor/stream/route.ts` | SSE endpoint — polls DB every 3s, streams 4 purchase groups |
| Create | `src/app/admin/(protected)/monitor/page.tsx` | Monitor page — EventSource consumer, 4 sections, step progress |
| Modify | `src/app/admin/_components/AdminSidebar.tsx` | Add "Monitor" nav item with Radio icon |
| Modify | `src/styles/admin.css` | Stuck banner styles + monitor page styles |
| Modify | `docs/status.md` | Document both features |

## Not Included (YAGNI)

- **No new DB tables** — reads existing Purchase fields
- **No Inngest dashboard proxy** — Inngest Cloud dashboard already exists for deep debugging
- **No websockets** — SSE is simpler and sufficient for unidirectional updates
- **No sound/desktop notifications** — could be added later if needed
- **No filtering/search on monitor** — it's a live dashboard, use Compras page for queries
