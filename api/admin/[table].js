import { isAuthorized } from '../_lib/auth.js'
import { isAllowedTable } from '../_lib/tables.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table } = req.query
  if (!isAllowedTable(table)) return res.status(400).json({ error: 'unknown table' })
  const sb = adminClient()

  if (req.method === 'GET') {
    const query = sb.from(table).select('*')
    const { data, error } = table === 'profile'
      ? await query
      : await query.order('sort_order').order('created_at')
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { data, error } = await sb.from(table).insert(req.body).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'method not allowed' })
}
