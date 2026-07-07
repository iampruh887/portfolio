import { Link, NavLink } from 'react-router-dom'
import '../style/theme.css'

function Shell({ label, children }) {
  return (
    <div className="shell">
      <header className="masthead">
        <Link to="/" className="masthead-name">NISHANT PRABHAT</Link>
        <span className="masthead-label">{label}</span>
        <nav className="masthead-nav">
          <NavLink to="/projects">projects</NavLink>
          <NavLink to="/blogs">blogs</NavLink>
          <NavLink to="/about">about</NavLink>
        </nav>
      </header>
      <main className="shell-main">{children}</main>
      <footer className="footrail">
        <span>© 2026 — Guwahati, IN</span>
        <span>
          <a href="mailto:iampruh887@gmail.com">email</a>
          {' · '}
          <a href="https://github.com/iampruh887" target="_blank" rel="noreferrer">github</a>
          {' · '}
          <a href="https://linkedin.com/in/nishant-prabhat" target="_blank" rel="noreferrer">linkedin</a>
        </span>
      </footer>
    </div>
  )
}

export default Shell
