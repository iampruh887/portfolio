import { isAuthorized } from '../_lib/auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  return res.status(200).json({ ok: true })
}
