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
  name: 'cleanup/search-results' | 'cleanup/leads' | 'cleanup/magic-codes' | 'cleanup/pending-purchases'
  data: Record<string, never>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AllEvents = SearchProcessEvent | CleanupEvent

export type { SearchProcessEvent, CleanupEvent, AllEvents }
