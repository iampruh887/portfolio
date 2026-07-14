import { lazy, Suspense } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Blog from './Blogs.jsx'
import Projects from './Projects.jsx'
import About from './pages/About.jsx'
import AdminGate from './components/AdminGate.jsx'
import GameOverlay from './components/GameOverlay.jsx'
import VisitTracker from './components/VisitTracker.jsx'
const Admin = lazy(() => import('./admin/Admin.jsx'))

const VIEW_PATHS = { menu: '/', projects: '/projects', blogs: '/blogs', about: '/about' }

function App() {
  const navigate = useNavigate()
  const handleNavigate = (view) => navigate(VIEW_PATHS[view] ?? '/')

  return (
    <>
      <Routes>
        <Route path="/" element={<Home onNavigate={handleNavigate} />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/blogs" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={
          <Suspense fallback={<div style={{ color: '#e9e4d6', padding: 40 }}>Loading…</div>}>
            <Admin />
          </Suspense>
        } />
        <Route path="*" element={<Home onNavigate={handleNavigate} />} />
      </Routes>
      <AdminGate />
      <GameOverlay />
      <VisitTracker />
    </>
  )
}

export default App
