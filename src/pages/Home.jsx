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
    </div>
  )
}

export default Home
