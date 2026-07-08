import { Link } from 'react-router-dom'
import Menu from '../Menu.jsx'
import '../style/theme.css'

function Home({ onNavigate }) {
  return (
    <div className="home-wrap">
      <header className="home-mast">
        <p className="home-name">NISHANT PRABHAT</p>
        <p className="home-tag">field notes of an AI/ML engineer in the making</p>
      </header>
      <div className="home-menu">
        <Menu onNavigate={onNavigate} />
      </div>
      <nav className="home-mobile-nav" aria-label="site index">
        <Link to="/projects"><span>01</span> projects</Link>
        <Link to="/blogs"><span>02</span> blogs</Link>
        <Link to="/about"><span>03</span> about me</Link>
      </nav>
      <footer className="home-foot">
        <span>B.Tech CSE — IIIT Guwahati</span>
        <span>
          <a href="mailto:iampruh887@gmail.com">email</a>
          {' · '}
          <a href="https://github.com/iampruh887" target="_blank" rel="noreferrer">github</a>
          {' · '}
          <a href="https://linkedin.com/in/nishant-prabhat" target="_blank" rel="noreferrer">linkedin</a>
        </span>
      </footer>
      <div className="home-stamp" aria-hidden="true">
        <div>NISHANT PRABHAT — PORTFOLIO</div>
        <div>DRW <b>NP-001</b> · SHT 01 OF 04</div>
        <div>SCALE 1:1 · REV B</div>
      </div>
    </div>
  )
}

export default Home
