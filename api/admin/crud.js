import { isAuthorized } from '../_lib/auth.js'
import { isAllowedTable } from '../_lib/tables.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

// Single static function handling all table CRUD. table + id come from the
// query string (?table=projects&id=uuid) so we avoid dynamic [param] routes,
// which vercel dev does not reliably resolve alongside the SPA fallback.
export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table, id } = req.query
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

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ error: 'id required' })
    const { data, error } = await sb.from(table).update(req.body).eq('id', id).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' })
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
