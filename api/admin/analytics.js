import { isAuthorized } from '../_lib/auth.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { data, error } = await adminClient().from('visit_events')
    .select('id, created_at, page_path, referrer, language, country, region, city, ip_hash')
    .order('created_at', { ascending: false }).limit(1000)
  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
