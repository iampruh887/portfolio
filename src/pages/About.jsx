import { useEffect, useState } from 'react'
import Menu from '../Menu.jsx'
import ContributionGraph from '../components/ContributionGraph.jsx'
import { fetchList, fetchProfile } from '../lib/content.js'
import '../style/About.css'

function Stars({ rating }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </span>
  )
}

function HeroRotator({ images }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (images.length < 2) return
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000)
    return () => clearInterval(t)
  }, [images.length])
  if (images.length === 0) {
    return <div className="hero-placeholder">this image will keep changing</div>
  }
  const img = images[index]
  return (
    <figure className="hero-figure">
      <img src={img.image_url} alt={img.caption || ''} />
      {img.caption && <figcaption>{img.caption}</figcaption>}
    </figure>
  )
}

function formatRange(exp) {
  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''
  if (!exp.start_date) return ''
  return `${fmt(exp.start_date)} – ${exp.is_current || !exp.end_date ? 'Present' : fmt(exp.end_date)}`
}

function About({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchList('projects'),
      fetchList('experiences'),
      fetchList('languages'),
      fetchList('skills'),
      fetchList('hero_images'),
    ])
      .then(([profile, projects, experiences, languages, skills, heroImages]) =>
        setData({ profile, projects, experiences, languages, skills, heroImages }))
      .catch(() => setError(true))
  }, [])

  if (error) return <div className="about-status">Couldn't load this page.</div>
  if (!data) return <div className="about-status">Loading…</div>

  const { profile, projects, experiences, languages, skills, heroImages } = data

  return (
    <div className="about-wrap">
      <div className="about-grid">
        <section className="about-panel contrib-panel">
          <ContributionGraph username={profile?.github_username} />
          <span className="panel-note">learn how we count contributions</span>
        </section>

        <section className="about-panel hero-panel">
          <HeroRotator images={heroImages} />
        </section>

        <div className="about-menu">
          <Menu onNavigate={onNavigate} />
        </div>

        <section className="about-panel works-panel">
          <h3>works</h3>
          <ul className="works-list">
            {projects.map((p) => (
              <li key={p.id}>
                <span className="work-title">{p.title}</span>
                {p.tech?.length > 0 && <span className="work-tech">{p.tech.join(' · ')}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="about-panel identity-panel">
          {profile?.avatar_url
            ? <img className="avatar" src={profile.avatar_url} alt={profile?.name || 'avatar'} />
            : <div className="avatar avatar-placeholder">{(profile?.name || '?').slice(0, 1)}</div>}
          <h2>{profile?.name}</h2>
          <p className="tagline">{profile?.tagline}</p>
          <p className="education">{profile?.education}</p>
          <div className="skills-grid">
            {skills.map((s) => (
              <div className="skill" key={s.id} title={s.name}>
                {s.icon_slug
                  ? <img src={`https://cdn.simpleicons.org/${s.icon_slug}`} alt={s.name} loading="lazy" />
                  : <span className="skill-text">{s.name}</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="about-panel right-panel">
          <div className="languages">
            {languages.map((l) => (
              <div className="language-row" key={l.id}>
                <span>{l.name}</span>
                <Stars rating={l.rating} />
              </div>
            ))}
          </div>
          <div className="experience">
            {experiences.map((e) => (
              <div className="exp-row" key={e.id}>
                <div className="exp-role">{e.role}{e.org ? ` @ ${e.org}` : ''}</div>
                <div className="exp-meta">{formatRange(e)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
