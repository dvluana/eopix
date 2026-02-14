/**
 * Analytics tracking with Plausible (cookieless, LGPD compliant)
 */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, string | number> }) => void
  }
}

export type AnalyticsEvent =
  | 'input_submitted'
  | 'teaser_viewed'
  | 'checkout_started'
  | 'payment_confirmed'
  | 'report_accessed'
  | 'login_attempted'
  | 'login_success'
  | 'admin_action'

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  }
}
