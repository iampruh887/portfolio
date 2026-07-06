import { useState } from 'react'
import { SECTIONS } from './sectionConfig.js'
import AdminSection from './AdminSection.jsx'
import { adminLogin, adminLoggedIn, adminLogout } from '../lib/adminApi.js'
import '../style/Admin.css'

function Login({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    try { await adminLogin(password); onSuccess() }
    catch { setError('Wrong password') }
  }
  return (
    <form className="admin-login" onSubmit={submit}>
      <h1>Admin</h1>
      <input type="password" autoFocus placeholder="password"
             value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Enter</button>
      {error && <p className="admin-error">{error}</p>}
    </form>
  )
}

function Admin() {
  const [loggedIn, setLoggedIn] = useState(adminLoggedIn())
  const tables = Object.keys(SECTIONS)
  const [active, setActive] = useState('projects')

  if (!loggedIn) return <div className="admin-wrap"><Login onSuccess={() => setLoggedIn(true)} /></div>

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>Portfolio admin</h1>
        <button className="secondary" onClick={() => { adminLogout(); setLoggedIn(false) }}>
          Log out
        </button>
      </header>
      <nav className="admin-tabs">
        {tables.map((t) => (
          <button key={t} className={t === active ? 'active' : ''} onClick={() => setActive(t)}>
            {SECTIONS[t].label}
          </button>
        ))}
      </nav>
      <AdminSection key={active} table={active} config={SECTIONS[active]} />
    </div>
  )
}

export default Admin
