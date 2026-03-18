import { Inngest } from 'inngest'

// Create Inngest client
export const inngest = new Inngest({
  id: 'eopix',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

// Type definitions for events
type SearchProcessEvent = {
  name: 'search/process'
  data: {
    purchaseId: string
    purchaseCode: string
    term: string
    type: 'CPF' | 'CNPJ'
    email: string
  }
}

type CleanupEvent = {
  name: 'cleanup/search-results' | 'cleanup/leads' | 'cleanup/pending-purchases'
  data: Record<string, never>
}

type PurchaseCreatedEvent = {
  name: 'purchase/created'
  data: {
    purchaseId: string
    email: string
    name: string
    term: string  // CPF/CNPJ limpo (só dígitos)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AllEvents = SearchProcessEvent | CleanupEvent | PurchaseCreatedEvent

export type { SearchProcessEvent, CleanupEvent, PurchaseCreatedEvent, AllEvents }
