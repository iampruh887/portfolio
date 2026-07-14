import { useEffect, useMemo, useState } from 'react'
import { adminAnalytics } from '../lib/adminApi.js'

const CITY_POINTS = {
  Delhi: [54, 23], Mumbai: [31, 49], Bengaluru: [43, 76], Bangalore: [43, 76],
  Hyderabad: [51, 65], Chennai: [57, 78], Kolkata: [78, 50], Pune: [35, 57],
  Ahmedabad: [22, 42], Jaipur: [39, 30], Lucknow: [60, 32], Kochi: [39, 91],
}

function IndiaMap({ rows }) {
  const points = useMemo(() => Object.entries(rows.reduce((out, row) => {
    if (row.country !== 'IN' || !CITY_POINTS[row.city]) return out
    out[row.city] = (out[row.city] ?? 0) + 1
    return out
  }, {})), [rows])
  const max = Math.max(1, ...points.map(([, count]) => count))
  return <svg className="india-map" viewBox="0 0 100 110" role="img" aria-label="India visitor heatmap">
    <path className="india-shape" d="M43 3 63 8 72 20 88 29 81 43 91 55 76 63 70 75 60 81 54 105 45 88 35 83 31 69 22 61 28 48 17 39 26 28 35 27Z" />
    {points.map(([city, count]) => { const [x, y] = CITY_POINTS[city]; return <circle key={city} cx={x} cy={y} r={3 + (count / max) * 5} className="heat-dot"><title>{city}: {count}</title></circle> })}
  </svg>
}

export default function Analytics() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { adminAnalytics().then(setRows).catch((e) => setError(e.message)) }, [])
  const cities = useMemo(() => Object.entries(rows.reduce((out, row) => { const key = row.city || row.region || row.country || 'Unknown'; out[key] = (out[key] ?? 0) + 1; return out }, {})).sort((a, b) => b[1] - a[1]), [rows])
  return <section className="admin-section analytics">
    {error && <p className="admin-error">{error}</p>}
    <p className="analytics-note">Showing the last {rows.length} visits. IPs are stored only as one-way hashes; names are not collected.</p>
    <div className="analytics-grid"><div><h2>India heatmap</h2><IndiaMap rows={rows} /></div><div><h2>Locations</h2><ul className="analytics-list">{cities.map(([name, count]) => <li key={name}><span>{name}</span><b>{count}</b></li>)}</ul></div></div>
    <h2>Recent visits</h2><div className="analytics-table">{rows.slice(0, 80).map((row) => <div className="analytics-row" key={row.id}><time>{new Date(row.created_at).toLocaleString()}</time><span>{[row.city, row.region, row.country].filter(Boolean).join(', ') || 'Unknown location'}</span><span>{row.page_path || '/'}</span></div>)}</div>
  </section>
}
