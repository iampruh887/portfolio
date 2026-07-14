import { createHash } from 'node:crypto'
import { adminClient } from './_lib/supabaseAdmin.js'

const text = (value, max) => String(value ?? '').slice(0, max)

function visitorIp(req) {
  return String(req.headers?.['x-forwarded-for'] ?? req.headers?.['x-real-ip'] ?? '')
    .split(',')[0].trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const ip = visitorIp(req)
  const secret = process.env.ANALYTICS_HASH_SECRET
  if (!secret) return res.status(503).json({ error: 'analytics not configured' })
  const body = typeof req.body === 'object' && req.body ? req.body : {}
  const ipHash = createHash('sha256').update(`${secret}:${ip}`).digest('hex')
  const row = {
    ip_hash: ipHash,
    page_path: text(body.path, 200),
    referrer: text(body.referrer, 500),
    user_agent: text(req.headers?.['user-agent'], 500),
    language: text(body.language, 40),
    country: text(req.headers?.['x-vercel-ip-country'], 80),
    region: text(req.headers?.['x-vercel-ip-country-region'], 120),
    city: text(req.headers?.['x-vercel-ip-city'], 120),
  }
  const { error } = await adminClient().from('visit_events').insert(row)
  if (error) return res.status(500).json({ error: 'could not record visit' })
  return res.status(204).end()
}
