import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Menu from '../Menu.jsx'
import '../style/theme.css'

const VIEW_PATHS = { menu: '/', projects: '/projects', blogs: '/blogs', about: '/about' }

function RingNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('nav-open', open)
    return () => document.documentElement.classList.remove('nav-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleNavigate = (view) => {
    setOpen(false)
    navigate(VIEW_PATHS[view] ?? '/')
  }

  return (
    <div className={`ring-nav ${open ? 'open' : ''}`} onMouseLeave={() => setOpen(false)}>
      {open ? (
        <div className="ring-nav-ring">
          <Menu onNavigate={handleNavigate} />
        </div>
      ) : (
        <button
          className="ring-nav-hub"
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          aria-label="open navigation"
        >
          🙭
        </button>
      )}
    </div>
  )
}

export default RingNav
