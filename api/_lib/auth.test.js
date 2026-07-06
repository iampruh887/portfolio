import { describe, it, expect, beforeEach } from 'vitest'
import { isAuthorized } from './auth.js'

describe('isAuthorized', () => {
  beforeEach(() => { process.env.ADMIN_PASSWORD = 'secret123' })

  it('accepts the correct password header', () => {
    expect(isAuthorized({ headers: { 'x-admin-password': 'secret123' } })).toBe(true)
  })
  it('rejects a wrong password', () => {
    expect(isAuthorized({ headers: { 'x-admin-password': 'nope' } })).toBe(false)
  })
  it('rejects a missing header', () => {
    expect(isAuthorized({ headers: {} })).toBe(false)
  })
  it('rejects everything when ADMIN_PASSWORD is unset', () => {
    delete process.env.ADMIN_PASSWORD
    expect(isAuthorized({ headers: { 'x-admin-password': '' } })).toBe(false)
  })
})
