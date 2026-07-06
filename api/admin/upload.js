import { isAuthorized } from '../_lib/auth.js'
import { adminClient } from '../_lib/supabaseAdmin.js'

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'unauthorized' })
  const { filename, contentType, dataBase64 } = req.body ?? {}
  if (!filename || !contentType || !dataBase64) {
    return res.status(400).json({ error: 'filename, contentType, dataBase64 required' })
  }
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'only image uploads allowed' })
  }
  const buffer = Buffer.from(dataBase64, 'base64')
  const path = `${Date.now()}-${String(filename).replace(/[^\w.-]/g, '_')}`
  const sb = adminClient()
  const { error } = await sb.storage.from('media').upload(path, buffer, { contentType })
  if (error) return res.status(400).json({ error: error.message })
  const { data } = sb.storage.from('media').getPublicUrl(path)
  return res.status(200).json({ url: data.publicUrl })
}
