import { isAuthorized } from '../../_lib/auth.js'
import { isAllowedTable } from '../../_lib/tables.js'
import { adminClient } from '../../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table, id } = req.query
  if (!isAllowedTable(table)) return res.status(400).json({ error: 'unknown table' })
  const sb = adminClient()

  if (req.method === 'PATCH') {
    const { data, error } = await sb.from(table).update(req.body).eq('id', id).select().single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'DELETE') {
    const { error } = await sb.from(table).delete().eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
