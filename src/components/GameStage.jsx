import { useEffect, useRef, useState, useCallback } from 'react'
import { Engine } from '../game/engine.js'
import { Renderer, measureMono } from '../game/render.js'
import { createInput } from '../game/input.js'
import { collectWords } from '../game/morph.js'
import { fetchList } from '../lib/content.js'

const FONT_PX = 18

export default function GameStage({ onExit }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const rendererRef = useRef(null)
  const inputRef = useRef(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const discoveriesRef = useRef([])

  const [phase, setPhase] = useState('intro') // intro | playing | discovery | gameover | rebuilding
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, high: 0 })
  const [discovery, setDiscovery] = useState(null)
  const [found, setFound] = useState([])
  const [over, setOver] = useState(null)
  const [banner, setBanner] = useState(null)

  // ---- one-time setup: theme, canvas, engine, data, loop ----
  useEffect(() => {
    document.documentElement.classList.add('game-active')
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h }
    }
    const { w, h } = size()
    const { cw, lh } = measureMono(ctx, FONT_PX)

    const renderer = new Renderer(FONT_PX)
    renderer.resize(w, h)
    rendererRef.current = renderer

    const engine = new Engine({
      width: w, height: h, cw, lh,
      onEvent: (type, data) => handleEvent(type, data),
    })
    engine.setLabels(collectWords())
    engineRef.current = engine

    const input = createInput()
    input.attach()
    inputRef.current = input

    // pull real portfolio for discoveries
    Promise.all([fetchList('projects'), fetchList('experiences')])
      .then(([projects, experiences]) => {
        discoveriesRef.current = [
          ...projects.map((p) => ({
            kind: 'PROJECT', title: p.title,
            sub: (p.tech || []).slice(0, 4).join(' · '), body: p.description,
          })),
          ...experiences.map((e) => ({
            kind: 'FIELD LOG', title: `${e.role}${e.org ? ' @ ' + e.org : ''}`,
            sub: e.date_label || '', body: e.description,
          })),
        ]
      })
      .catch(() => { discoveriesRef.current = [] })

    const onResize = () => {
      const d = size()
      renderer.resize(d.w, d.h)
      engine.resize(d.w, d.h)
    }
    window.addEventListener('resize', onResize)

    lastRef.current = performance.now()
    const loop = (now) => {
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      if (!document.hidden) {
        engine.step(dt, input)
        renderer.draw(ctx, engine, Math.min(dt, 0.05))
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      input.detach()
      window.removeEventListener('resize', onResize)
      document.documentElement.classList.remove('game-active')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flashBanner = useCallback((text) => {
    setBanner(text)
    setTimeout(() => setBanner((b) => (b === text ? null : b)), 1600)
  }, [])

  const handleEvent = useCallback((type, data) => {
    if (type === 'score') setHud((h) => ({ ...h, score: data }))
    else if (type === 'life') setHud((h) => ({ ...h, lives: data }))
    else if (type === 'levelup') { setHud((h) => ({ ...h, level: data })); flashBanner(`LEVEL ${data}`) }
    else if (type === 'boss') flashBanner('⚠ CAPITAL SHIP INBOUND')
    else if (type === 'powerup') flashBanner(`+${String(data).toUpperCase()}`)
    else if (type === 'discovery') {
      const list = discoveriesRef.current
      if (!list.length) { engineRef.current?.resumeFromDiscovery(); return }
      const item = list[data % list.length]
      setDiscovery(item)
      setPhase('discovery')
    } else if (type === 'gameover') {
      setOver(data)
      setPhase('gameover')
    }
  }, [flashBanner])

  const launch = useCallback(() => {
    engineRef.current?.start()
    setHud((h) => ({ ...h, high: engineRef.current.high }))
    setPhase('playing')
  }, [])

  const collectDiscovery = useCallback(() => {
    setFound((f) => (discovery && !f.some((x) => x.title === discovery.title) ? [...f, discovery] : f))
    setDiscovery(null)
    engineRef.current?.resumeFromDiscovery()
    setPhase('playing')
  }, [discovery])

  const playAgain = useCallback(() => {
    const e = engineRef.current
    e.reset()
    e.setLabels(collectWords())
    setFound([])
    setOver(null)
    setHud({ score: 0, lives: 3, level: 1, high: e.high })
    e.start()
    setPhase('playing')
  }, [])

  const exitToSite = useCallback(() => {
    setPhase('rebuilding')
    document.documentElement.classList.remove('game-active')
    document.documentElement.classList.add('game-rebuild')
    setTimeout(() => {
      document.documentElement.classList.remove('game-rebuild')
      onExit()
    }, 1700)
  }, [onExit])

  // intro launch + ESC handling (bound to window, doesn't fight canvas input)
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase()
      if (phase === 'intro' && (k === 'enter' || k === ' ')) { e.preventDefault(); launch() }
      else if (phase === 'discovery' && k === 'enter') { e.preventDefault(); collectDiscovery() }
      else if (k === 'escape' && (phase === 'playing' || phase === 'discovery')) exitToSite()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, launch, collectDiscovery, exitToSite])

  return (
    <div className={`pi-stage pi-${phase}`}>
      <canvas ref={canvasRef} className="pi-canvas" />

      {(phase === 'playing' || phase === 'discovery') && (
        <div className="pi-hud">
          <span>SCORE <b>{String(hud.score).padStart(6, '0')}</b></span>
          <span>LVL <b>{hud.level}</b></span>
          <span className="pi-lives">{'▲'.repeat(Math.max(0, hud.lives))}</span>
          <span className="pi-hud-hint">ESC to abort</span>
        </div>
      )}

      {banner && <div className="pi-banner">{banner}</div>}

      {phase === 'intro' && (
        <div className="pi-modal pi-tutorial">
          <span className="pi-kick">◇ SYSTEM OVERRIDE</span>
          <h2>the portfolio has been weaponized.</h2>
          <p>your text is scrambling into hostile ASCII craft. take the rocket and clear them.</p>
          <ul className="pi-keys">
            <li><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> — fly</li>
            <li><kbd>SPACE</kbd> — fire</li>
            <li><kbd>ESC</kbd> — abort &amp; rebuild the site</li>
            <li>destroy ships to <b>uncover real projects</b></li>
          </ul>
          <button className="pi-btn" onClick={launch}>launch ↵</button>
        </div>
      )}

      {phase === 'discovery' && discovery && (
        <div className="pi-modal pi-discovery">
          <span className="pi-kick">⟢ A WILD THING APPEARED</span>
          <span className="pi-disc-kind">{discovery.kind}</span>
          <h2>{discovery.title}</h2>
          {discovery.sub && <p className="pi-disc-sub">{discovery.sub}</p>}
          {discovery.body && <p className="pi-disc-body">{trim(discovery.body, 220)}</p>}
          <button className="pi-btn" onClick={collectDiscovery}>collect ↵</button>
        </div>
      )}

      {phase === 'gameover' && over && (
        <div className="pi-modal pi-gameover">
          <span className="pi-kick">✶ RUN COMPLETE</span>
          <h2>score {String(over.score).padStart(6, '0')}</h2>
          <p className="pi-go-meta">reached level {over.level} · high {String(over.high).padStart(6, '0')}</p>
          <div className="pi-found">
            <span className="pi-found-label">recovered {found.length} artifact{found.length === 1 ? '' : 's'}:</span>
            <ul>{found.map((f) => <li key={f.title}>{f.title}</li>)}</ul>
          </div>
          <div className="pi-go-actions">
            <button className="pi-btn" onClick={playAgain}>play again</button>
            <button className="pi-btn pi-btn-ghost" onClick={exitToSite}>rebuild the site ↗</button>
          </div>
        </div>
      )}

      {phase === 'rebuilding' && (
        <div className="pi-rebuild">
          <span className="pi-rebuild-text">RECONSTRUCTING PORTFOLIO</span>
          <div className="pi-rebuild-bar"><i /></div>
        </div>
      )}
    </div>
  )
}

function trim(s, n) { return s && s.length > n ? s.slice(0, n).trimEnd() + '…' : s }
