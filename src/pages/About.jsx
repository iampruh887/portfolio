import { useEffect, useState } from 'react'
import Shell from '../components/Shell.jsx'
import RingNav from '../components/RingNav.jsx'
import ContributionGraph from '../components/ContributionGraph.jsx'
import { fetchList, fetchProfile } from '../lib/content.js'
import '../style/About.css'
import PixelDissolve from '../components/PixelDissolve.jsx'

const CATEGORY_ORDER = ['language', 'framework', 'library', 'ai_tool', 'dev_tool', 'other']
const CATEGORY_LABELS = {
  language: 'programming',
  framework: 'frameworks',
  library: 'libraries',
  ai_tool: 'ai / agents',
  dev_tool: 'tooling',
  other: 'misc',
}

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
  if (images.length === 0) {
    return <div className="ab-fig-placeholder">photograph pending</div>
  }
  const img = images[index]
  return (
    <figure className="ab-fig">
      <PixelDissolve images={images} onIndexChange={setIndex} />
      <figcaption>FIG. {String(index + 1).padStart(2, '0')}{img.caption ? ` — ${img.caption}` : ''}</figcaption>
    </figure>
  )
}

function formatRange(exp) {
  const fmt = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  if (!exp.start_date) return ''
  return `${fmt(exp.start_date)} – ${exp.is_current || !exp.end_date ? 'Present' : fmt(exp.end_date)}`
}

function About() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchProfile(),
      fetchList('experiences'),
      fetchList('languages'),
      fetchList('skills'),
      fetchList('hero_images'),
    ])
      .then(([profile, experiences, languages, skills, heroImages]) =>
        setData({ profile, experiences, languages, skills, heroImages }))
      .catch(() => setError(true))
  }, [])

  const skillGroups = data
    ? CATEGORY_ORDER
        .map((c) => [c, data.skills.filter((s) => s.category === c)])
        .filter(([, items]) => items.length > 0)
    : []

  return (
    <Shell label="PERSONNEL RECORD — SHT 04">
      {error && <p className="status-line">couldn't reach the archive. try again later.</p>}
      {!error && !data && <p className="status-line">loading…</p>}
      {data && (
        <div className="about-sheet">
          <header className="ab-head">
            <div className="ab-id">
              {data.profile?.avatar_url
                ? <img className="ab-avatar" src={data.profile.avatar_url} alt={data.profile?.name || 'portrait'} />
                : <div className="ab-avatar ab-avatar-blank">{(data.profile?.name || '?').slice(0, 1)}</div>}
              <div className="ab-id-text">
                <h1 className="ab-name">{data.profile?.name}</h1>
                <p className="ab-tag">{data.profile?.tagline}</p>
                {data.profile?.bio && <p className="ab-bio">{data.profile.bio}</p>}
                {data.profile?.education && <p className="ab-edu">{data.profile.education}</p>}
              </div>
            </div>
            <HeroRotator images={data.heroImages} />
          </header>

          <section className="ab-section">
            <div className="ab-kicker"><b>01</b> — CONTRIBUTIONS</div>
            <ContributionGraph username={data.profile?.github_username} />
          </section>

          <div className="ab-cols">
            <section className="ab-section">
              <div className="ab-kicker"><b>02</b> — EXPERIENCE</div>
              {data.experiences.map((e) => (
                <div className="ab-exp-row" key={e.id}>
                  <div className="ab-exp-main">
                    <span className="ab-exp-role">{e.role}{e.org ? ` @ ${e.org}` : ''}</span>
                    <span className="ab-exp-dates">{formatRange(e)}</span>
                  </div>
                  {e.description && <p className="ab-exp-desc">{e.description}</p>}
                </div>
              ))}
            </section>

            <RingNav />

            <div className="ab-side">
              <section className="ab-section">
                <div className="ab-kicker"><b>03</b> — SPOKEN</div>
                {data.languages.map((l) => (
                  <div className="ab-lang-row" key={l.id}>
                    <span>{l.name}</span>
                    <Stars rating={l.rating} />
                  </div>
                ))}
              </section>

              <section className="ab-section">
                <div className="ab-kicker"><b>04</b> — STACK</div>
                {skillGroups.map(([cat, items]) => (
                  <div className="ab-stack-row" key={cat}>
                    <span className="ab-stack-cat">{CATEGORY_LABELS[cat]}</span>
                    <span className="ab-stack-items">{items.map((s) => s.name).join(' · ')}</span>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}

export default About
