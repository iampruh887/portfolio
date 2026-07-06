const PW_KEY = 'admin_pw'

function headers(json = true) {
  const h = { 'x-admin-password': sessionStorage.getItem(PW_KEY) ?? '' }
  if (json) h['content-type'] = 'application/json'
  return h
}

async function unwrap(resPromise) {
  const res = await resPromise
  const text = await res.text().catch(() => '')
  let body = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = {} }
  if (!res.ok) throw new Error(body.error ?? (text || `HTTP ${res.status}`))
  return body
}

export async function adminLogin(password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'x-admin-password': password },
  })
  if (!res.ok) throw new Error('Wrong password')
  sessionStorage.setItem(PW_KEY, password)
  return true
}

export function adminLoggedIn() {
  return Boolean(sessionStorage.getItem(PW_KEY))
}

export function adminLogout() {
  sessionStorage.removeItem(PW_KEY)
}

export const adminList = (table) =>
  unwrap(fetch(`/api/admin/${table}`, { headers: headers(false) }))

export const adminCreate = (table, row) =>
  unwrap(fetch(`/api/admin/${table}`, { method: 'POST', headers: headers(), body: JSON.stringify(row) }))

export const adminUpdate = (table, id, patch) =>
  unwrap(fetch(`/api/admin/${table}/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) }))

export const adminDelete = (table, id) =>
  unwrap(fetch(`/api/admin/${table}/${id}`, { method: 'DELETE', headers: headers(false) }))

export const adminReorder = (table, ids) =>
  unwrap(fetch('/api/admin/reorder', { method: 'POST', headers: headers(), body: JSON.stringify({ table, ids }) }))

export async function adminUpload(file) {
  const dataBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const body = { filename: file.name, contentType: file.type, dataBase64 }
  const out = await unwrap(fetch('/api/admin/upload', {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  }))
  if (!out.url) throw new Error('Upload response missing url')
  return out.url
}
