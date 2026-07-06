import { Routes, Route, useNavigate } from 'react-router-dom'
import Menu from './Menu.jsx'
import Blog from './Blogs.jsx'
import Projects from './Projects.jsx'
import About from './pages/About.jsx'

const VIEW_PATHS = { menu: '/', projects: '/projects', blogs: '/blogs', about: '/about' }

function App() {
  const navigate = useNavigate()
  const handleNavigate = (view) => navigate(VIEW_PATHS[view] ?? '/')

  return (
    <Routes>
      <Route path="/" element={<Menu onNavigate={handleNavigate} />} />
      <Route path="/projects" element={<Projects onNavigate={handleNavigate} />} />
      <Route path="/blogs" element={<Blog onNavigate={handleNavigate} />} />
      <Route path="/about" element={<About onNavigate={handleNavigate} />} />
      <Route path="*" element={<Menu onNavigate={handleNavigate} />} />
    </Routes>
  )
}

export default App