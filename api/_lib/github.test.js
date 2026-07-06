import { describe, it, expect } from 'vitest'
import { normalizeCalendar } from './github.js'

const fixture = {
  totalContributions: 42,
  weeks: [
    { contributionDays: [
      { date: '2026-06-29', contributionCount: 0, contributionLevel: 'NONE' },
      { date: '2026-06-30', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
      { date: '2026-07-01', contributionCount: 12, contributionLevel: 'FOURTH_QUARTILE' },
    ]},
  ],
}

describe('normalizeCalendar', () => {
  it('maps GitHub quartile levels to 0-4 and keeps counts/dates', () => {
    const out = normalizeCalendar(fixture)
    expect(out.total).toBe(42)
    expect(out.weeks).toHaveLength(1)
    expect(out.weeks[0].days).toEqual([
      { date: '2026-06-29', count: 0, level: 0 },
      { date: '2026-06-30', count: 3, level: 1 },
      { date: '2026-07-01', count: 12, level: 4 },
    ])
  })
  it('defaults unknown levels to 0', () => {
    const out = normalizeCalendar({ totalContributions: 1, weeks: [
      { contributionDays: [{ date: '2026-01-01', contributionCount: 1, contributionLevel: 'WEIRD' }] },
    ]})
    expect(out.weeks[0].days[0].level).toBe(0)
  })
})
