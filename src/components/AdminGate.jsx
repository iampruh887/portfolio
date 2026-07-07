import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, adminLoggedIn, adminLogout } from '../lib/adminApi.js'
import '../style/AdminGate.css'

// Secret sequence: type it anywhere on the site (Ctrl+Shift+A also works).
const SECRET = 'pruh'

function AdminGate() {
  const [modalOpen, setModalOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(adminLoggedIn())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const bufferRef = useRef('')
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setModalOpen(true)
        return
      }
      // ignore typing inside inputs/textareas
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      if (e.key.length !== 1) return
      bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-SECRET.length)
      if (bufferRef.current === SECRET) {
        bufferRef.current = ''
        setModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!password || checking) return
    setChecking(true)
    setError('')
    try {
      await adminLogin(password)
      setUnlocked(true)
      setModalOpen(false)
      setPassword('')
    } catch {
      setError('Nope.')
    } finally {
      setChecking(false)
    }
  }

  const lock = () => {
    adminLogout()
    setUnlocked(false)
  }

  return (
    <>
      {modalOpen && !unlocked && (
        <div className="gate-backdrop" onClick={() => setModalOpen(false)}>
          <form className="gate-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <span className="gate-title">who goes there?</span>
            <input
              type="password"
              autoFocus
              placeholder="access key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={checking}>{checking ? '…' : 'unlock'}</button>
            {error && <span className="gate-error">{error}</span>}
          </form>
        </div>
      )}

      {unlocked && (
        <div className="gate-chip">
          <button className="gate-chip-main" onClick={() => navigate('/admin')} title="Open editor">
            ✎ edit site
          </button>
          <button className="gate-chip-lock" onClick={lock} title="Lock">
            ×
          </button>
        </div>
      )}
    </>
  )
}

export default AdminGate
