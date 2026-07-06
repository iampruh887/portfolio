import Menu from '../Menu.jsx'

function About({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>
      <p>About page — built in Task 10.</p>
      <div style={{ transform: 'scale(0.4)' }}>
        <Menu onNavigate={onNavigate} />
      </div>
    </div>
  )
}

export default About
