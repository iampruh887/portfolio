import { describe, it, expect } from 'vitest'
import { ALLOWED_TABLES, isAllowedTable } from './tables.js'

describe('table allowlist', () => {
  it('contains exactly the 7 content tables', () => {
    expect([...ALLOWED_TABLES].sort()).toEqual(
      ['blogs','experiences','hero_images','languages','profile','projects','skills'])
  })
  it('accepts a known table', () => {
    expect(isAllowedTable('projects')).toBe(true)
  })
  it('rejects unknown / injection-y names', () => {
    expect(isAllowedTable('users; drop table projects')).toBe(false)
    expect(isAllowedTable('storage.objects')).toBe(false)
  })
})
