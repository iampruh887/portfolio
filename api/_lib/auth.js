import { timingSafeEqual } from 'node:crypto'

export function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const given = String(req.headers?.['x-admin-password'] ?? '')
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
