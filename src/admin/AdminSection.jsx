import { useEffect, useState, useCallback } from 'react'
import {
  adminList, adminCreate, adminUpdate, adminDelete, adminReorder, adminUpload,
} from '../lib/adminApi.js'

function Field({ field, value, onChange }) {
  const set = (v) => onChange(field.name, v)
  switch (field.type) {
    case 'textarea':
      return <textarea rows={5} value={value ?? ''} onChange={(e) => set(e.target.value)} />
    case 'number':
      return <input type="number" min={field.min} max={field.max}
                    value={value ?? ''} onChange={(e) => set(Number(e.target.value))} />
    case 'checkbox':
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
    case 'date':
      return <input type="date" value={value ?? ''} onChange={(e) => set(e.target.value)} />
    case 'select':
      return (
        <select value={value ?? field.options[0]} onChange={(e) => set(e.target.value)}>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    case 'tags':
      return <input type="text" placeholder="comma, separated"
                    value={Array.isArray(value) ? value.join(', ') : (value ?? '')}
                    onChange={(e) => set(e.target.value)} />
    case 'image':
      return (
        <div className="image-field">
          {value && <img src={value} alt="" className="image-preview" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try { set(await adminUpload(file)) }
            catch (err) { alert(`Upload failed: ${err.message}`) }
          }} />
          <input type="text" placeholder="or paste URL" value={value ?? ''}
                 onChange={(e) => set(e.target.value)} />
        </div>
      )
    default:
      return <input type="text" value={value ?? ''} onChange={(e) => set(e.target.value)} />
  }
}

function normalize(fields, form) {
  const out = { ...form }
  for (const f of fields) {
    if (f.type === 'tags' && typeof out[f.name] === 'string') {
      out[f.name] = out[f.name].split(',').map((s) => s.trim()).filter(Boolean)
    }
    if (f.type === 'date' && out[f.name] === '') out[f.name] = null
  }
  return out
}

function RowForm({ config, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? {})
  const change = (name, v) => setForm((f) => ({ ...f, [name]: v }))
  const missing = config.fields.filter((f) => f.required && !form[f.name])
  return (
    <div className="row-form">
      {config.fields.map((f) => (
        <label key={f.name}>
          <span>{f.name}{f.required ? ' *' : ''}</span>
          <Field field={f} value={form[f.name]} onChange={change} />
        </label>
      ))}
      <div className="form-actions">
        <button disabled={missing.length > 0} onClick={() => onSave(normalize(config.fields, form))}>
          Save
        </button>
        {onCancel && <button className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  )
}

function AdminSection({ table, config }) {
  const [rows, setRows] = useState([])
  const [editing, setEditing] = useState(null) // row id | 'new' | null
  const [error, setError] = useState('')

  const load = useCallback(() => {
    adminList(table).then(setRows).catch((e) => setError(e.message))
  }, [table])

  useEffect(() => { load() }, [load])

  const wrap = (fn) => async (...args) => {
    setError('')
    try { await fn(...args); setEditing(null); load() }
    catch (e) { setError(e.message) }
  }

  const create = wrap((form) => adminCreate(table, { ...form, sort_order: rows.length + 1 }))
  const update = wrap((id, form) => adminUpdate(table, id, form))
  const remove = wrap(async (id) => {
    if (!confirm('Delete this item?')) throw new Error('cancelled')
    await adminDelete(table, id)
  })
  const togglePublish = wrap((row) => adminUpdate(table, row.id, { is_published: !row.is_published }))
  const move = wrap(async (index, delta) => {
    const ids = rows.map((r) => r.id)
    const j = index + delta
    if (j < 0 || j >= ids.length) throw new Error('cancelled')
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await adminReorder(table, ids)
  })

  if (config.single) {
    const row = rows[0]
    if (!row) return <p>Loading…</p>
    return (
      <div className="admin-section">
        {error && <p className="admin-error">{error}</p>}
        <RowForm config={config} initial={row} onSave={(form) => update(row.id, form)} />
      </div>
    )
  }

  return (
    <div className="admin-section">
      {error && <p className="admin-error">{error}</p>}
      {editing === 'new'
        ? <RowForm config={config} onSave={create} onCancel={() => setEditing(null)} />
        : <button onClick={() => setEditing('new')}>+ Add</button>}
      <ul className="admin-rows">
        {rows.map((row, i) => (
          <li key={row.id} className={row.is_published ? '' : 'unpublished'}>
            {editing === row.id ? (
              <RowForm config={config} initial={row}
                       onSave={(form) => update(row.id, form)}
                       onCancel={() => setEditing(null)} />
            ) : (
              <div className="admin-row">
                <span className="row-title">{row[config.titleField] || '(untitled)'}</span>
                <span className="row-actions">
                  <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1}>↓</button>
                  <button onClick={() => togglePublish(row)}>
                    {row.is_published ? 'hide' : 'show'}
                  </button>
                  <button onClick={() => setEditing(row.id)}>edit</button>
                  <button className="danger" onClick={() => remove(row.id)}>delete</button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminSection
