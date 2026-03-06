import { describe, it, expect } from 'vitest'
import { functions } from '@/lib/inngest/crons'
import { processSearch } from '@/lib/inngest/process-search'

describe('Inngest functions export', () => {
  it('should include processSearch in the functions array', () => {
    expect(functions).toContain(processSearch)
  })

  it('should have exactly 6 functions (5 crons + processSearch)', () => {
    expect(functions).toHaveLength(6)
  })
})
