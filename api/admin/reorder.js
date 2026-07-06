import { isAuthorized } from '../_lib/auth.js'
import { isAllowedTable } from '../_lib/tables.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { table, ids } = req.body ?? {}
  if (!isAllowedTable(table) || table === 'profile' || !Array.isArray(ids)
      || ids.length === 0 || ids.some((id) => id == null)) {
    return res.status(400).json({ error: 'bad request' })
  }
  const sb = adminClient()
  for (let i = 0; i < ids.length; i++) {
    const { error } = await sb.from(table).update({ sort_order: i + 1 }).eq('id', ids[i])
    if (error) return res.status(400).json({ error: error.message })
  }
  return res.status(200).json({ ok: true })
}
