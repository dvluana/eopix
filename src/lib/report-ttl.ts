const DEFAULT_REPORT_TTL_HOURS = 168 // 7 days

export function getReportTtlHours(): number {
  const raw = process.env.REPORT_TTL_HOURS
  if (!raw) return DEFAULT_REPORT_TTL_HOURS

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_REPORT_TTL_HOURS
  }

  return parsed
}

export function getReportExpiresAt(): Date {
  const ttlMs = getReportTtlHours() * 60 * 60 * 1000
  return new Date(Date.now() + ttlMs)
}
