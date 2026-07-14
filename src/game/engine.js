// PORTFOLIO INVADERS — framework-free game core.
// The React layer owns the canvas + rAF; it calls step(dt, input) each frame,
// reads world state for rendering, and reacts to emitted events.
import {
  makeRocket, makeEnemy, makeBoss, makeBullet, makeParticle, makePowerup, overlap, spriteCols,
} from './entities.js'
import { buildLevel, KILLS_PER_DISCOVERY } from './levels.js'
import { EXPLOSION } from './ascii.js'

const ROCKET_SPEED = 340
const PLAYER_BULLET_V = -560
const ENEMY_BULLET_V = 250
const FIRE_COOLDOWN = 0.22
const RAPID_COOLDOWN = 0.09
const MAX_PARTICLES = 260
const MAX_ENEMY_BULLETS = 80
const POWERUP_TYPES = ['rapid', 'shield', 'spread']

export class Engine {
  constructor({ width, height, cw = 10, lh = 18, onEvent = () => {} }) {
    this.w = width
    this.h = height
    this.cw = cw
    this.lh = lh
    this.onEvent = onEvent
    this.reset()
  }

  reset() {
    this.state = 'tutorial' // tutorial | playing | boss | discovery | gameover
    this.level = 1
    this.score = 0
    this.kills = 0
    this.killsSinceDiscovery = 0
    this.rocket = makeRocket(this.w / 2 - 28, this.h - 100)
    this.enemies = []
    this.bullets = []
    this.eBullets = []
    this.particles = []
    this.powerups = []
    this.pending = []
    this.pi = 0
    this.spawnTotal = 0
    this.spawnClock = 0
    this.boss = null
    this.discoveryIndex = 0
    this.labels = this.labels || []
    this.high = readHigh()
  }

  setLabels(arr) { this.labels = Array.isArray(arr) ? arr : [] }

  resize(w, h) {
    this.w = w
    this.h = h
    if (this.rocket) {
      this.rocket.x = Math.min(this.rocket.x, w - 56)
      this.rocket.y = Math.min(this.rocket.y, h - 60)
    }
  }

  start() {
    this.state = 'playing'
    this._loadLevel(this.level)
  }

  _loadLevel(level) {
    const { waves } = buildLevel(level, this.w)
    this.pending = []
    for (const wave of waves) {
      for (const e of wave.enemies) {
        this.pending.push({ ...e, t: wave.at + e.delay })
      }
    }
    this.pending.sort((a, b) => a.t - b.t)
    this.pi = 0
    this.spawnClock = 0
    this.boss = null
    this.bossSpawned = false
  }

  emit(type, data) { this.onEvent(type, data) }

  // called by React when a discovery card is dismissed
  resumeFromDiscovery() { if (this.state === 'discovery') this.state = 'playing' }

  step(dt, input) {
    // clamp dt to avoid tunnelling after tab-switch
    dt = Math.min(dt, 0.05)
    this.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt })
    this.particles = this.particles.filter((p) => p.life > 0)

    if (this.state !== 'playing' && this.state !== 'boss') return

    this._stepRocket(dt, input)
    this._spawnWaves(dt)
    this._stepEnemies(dt)
    if (this.boss) this._stepBoss(dt)
    this._stepBullets(dt)
    this._stepPowerups(dt)
    this._collisions()
    this._progress()
  }

  _stepRocket(dt, input) {
    const r = this.rocket
    r.x += input.axisX() * ROCKET_SPEED * dt
    r.y += input.axisY() * ROCKET_SPEED * dt
    const wpx = spriteCols(r.art) * this.cw
    const hpx = r.art.length * this.lh
    r.x = clamp(r.x, 4, this.w - wpx - 4)
    r.y = clamp(r.y, 40, this.h - hpx - 8)
    if (r.invuln > 0) r.invuln -= dt
    if (r.weaponTime > 0) { r.weaponTime -= dt; if (r.weaponTime <= 0) r.weapon = 'single' }
    r.cooldown -= dt
    if (input.firing() && r.cooldown <= 0) {
      this._fire(r)
      r.cooldown = r.weapon === 'rapid' ? RAPID_COOLDOWN : FIRE_COOLDOWN
    }
  }

  _fire(r) {
    const cx = r.x + (spriteCols(r.art) * this.cw) / 2
    const y = r.y - 4
    if (r.weapon === 'spread') {
      this.bullets.push(makeBullet(cx, y, PLAYER_BULLET_V, 'player'))
      const b1 = makeBullet(cx, y, PLAYER_BULLET_V, 'player'); b1.vx = -160
      const b2 = makeBullet(cx, y, PLAYER_BULLET_V, 'player'); b2.vx = 160
      this.bullets.push(b1, b2)
    } else {
      this.bullets.push(makeBullet(cx, y, PLAYER_BULLET_V, 'player'))
    }
  }

  _spawnWaves(dt) {
    this.spawnClock += dt
    while (this.pi < this.pending.length && this.pending[this.pi].t <= this.spawnClock) {
      const s = this.pending[this.pi]
      // every other ship carries a real portfolio word (the content morph)
      const label = this.labels.length && this.spawnTotal % 2 === 0
        ? this.labels[this.spawnTotal % this.labels.length] : null
      // Every fifth ship is a glowing carrier so powerups are part of the
      // encounter design, not just a rare random event.
      const powerupType = this.spawnTotal % 5 === 4
        ? POWERUP_TYPES[this.spawnTotal % POWERUP_TYPES.length]
        : null
      this.enemies.push(makeEnemy(s.type, s.x, s.y, label, powerupType))
      this.pi++
      this.spawnTotal++
    }
  }

  _stepEnemies(dt) {
    for (const e of this.enemies) {
      e.t += dt
      const b = e.spec.behavior
      if (b === 'weave') {
        e.x = e.baseX + Math.sin(e.t * 2) * 60
        e.y += e.spec.speed * dt
      } else if (b === 'dive') {
        e.y += e.spec.speed * dt
        e.x += Math.sin(e.t * 5) * 40 * dt * 6
      } else { // advance — drift toward the rocket's column
        e.y += e.spec.speed * dt
        e.x += Math.sign(this.rocket.x - e.x) * 18 * dt
      }
      if (e.spec.evil && e.spec.fireRate) {
        e.fireT -= dt
        if (e.fireT <= 0 && e.y < this.h * 0.7) {
          const cx = e.x + (spriteCols(e.art) * this.cw) / 2
          if (this.eBullets.length < MAX_ENEMY_BULLETS) {
            this.eBullets.push(makeBullet(cx, e.y + e.art.length * this.lh, ENEMY_BULLET_V, 'enemy'))
          }
          e.fireT = e.spec.fireRate * (0.7 + Math.random() * 0.6)
        }
      }
    }
    // cull off-screen
    this.enemies = this.enemies.filter((e) => e.y < this.h + 40)
  }

  _stepBoss(dt) {
    const boss = this.boss
    boss.t += dt
    if (boss.y < 60) boss.y += 30 * dt
    boss.x += boss.dir * 70 * dt
    const wpx = spriteCols(boss.art) * this.cw
    if (boss.x < 10) { boss.x = 10; boss.dir = 1 }
    if (boss.x > this.w - wpx - 10) { boss.x = this.w - wpx - 10; boss.dir = -1 }
    boss.fireT -= dt
    if (boss.fireT <= 0) {
      const n = 5
      for (let i = 0; i < n; i++) {
        const bx = boss.x + (wpx * (i + 0.5)) / n
        const bb = makeBullet(bx, boss.y + boss.art.length * this.lh, ENEMY_BULLET_V, 'enemy')
        bb.vx = (i - (n - 1) / 2) * 40
        if (this.eBullets.length < MAX_ENEMY_BULLETS) this.eBullets.push(bb)
      }
      boss.fireT = boss.spec.fireRate
    }
  }

  _stepBullets(dt) {
    for (const b of this.bullets) { b.x += b.vx * dt; b.y += b.vy * dt }
    for (const b of this.eBullets) { b.x += b.vx * dt; b.y += b.vy * dt }
    this.bullets = this.bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < this.w + 20)
    this.eBullets = this.eBullets.filter((b) => b.y < this.h + 20)
  }

  _stepPowerups(dt) {
    for (const p of this.powerups) p.y += p.vy * dt
    this.powerups = this.powerups.filter((p) => p.y < this.h + 20)
  }

  _collisions() {
    const cw = this.cw, lh = this.lh
    // player bullets -> enemies / boss
    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.dead) continue
        if (pointInBox(b, e, cw, lh)) {
          b.dead = true
          e.hp -= 1
          if (e.hp <= 0) this._killEnemy(e)
          break
        }
      }
      if (this.boss && !b.dead && pointInBox(b, this.boss, cw, lh)) {
        b.dead = true
        this.boss.hp -= 1
        this._burst(b.x, b.y, this.boss.color, 3)
        if (this.boss.hp <= 0) this._killBoss()
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead)
    this.enemies = this.enemies.filter((e) => !e.dead)

    if (this.rocket.invuln > 0) return
    // enemy bullets -> rocket
    for (const b of this.eBullets) {
      if (overlapPoint(b, this.rocket, cw, lh)) { b.dead = true; this._hitRocket() }
    }
    this.eBullets = this.eBullets.filter((b) => !b.dead)
    // enemy bodies -> rocket
    for (const e of this.enemies) {
      if (overlap(e, this.rocket, cw, lh)) { this._killEnemy(e); this._hitRocket(); break }
    }
    this.enemies = this.enemies.filter((e) => !e.dead)
    // powerups -> rocket
    for (const p of this.powerups) {
      if (overlap(p, this.rocket, cw, lh)) { p.dead = true; this._applyPowerup(p.ptype) }
    }
    this.powerups = this.powerups.filter((p) => !p.dead)
  }

  _killEnemy(e) {
    e.dead = true
    this._burst(e.x, e.y, e.color, 6)
    this.score += e.spec.score
    this.kills += 1
    this.killsSinceDiscovery += 1
    this.emit('score', this.score)
    if (e.powerupType || Math.random() < 0.24) {
      const type = e.powerupType || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
      this.powerups.push(makePowerup(e.x, e.y, type))
    }
    if (this.killsSinceDiscovery >= KILLS_PER_DISCOVERY && this.state === 'playing') {
      this.killsSinceDiscovery = 0
      this.state = 'discovery'
      this.emit('discovery', this.discoveryIndex++)
    }
  }

  _killBoss() {
    this._burst(this.boss.x, this.boss.y, this.boss.color, 40)
    this.score += this.boss.spec.score
    this.emit('score', this.score)
    this.boss = null
    this._nextLevel()
  }

  _hitRocket() {
    const r = this.rocket
    if (r.shield > 0) { r.shield -= 1; r.invuln = 1.0; this._burst(r.x, r.y, '#7db8ff', 8); return }
    r.hp -= 1
    r.invuln = 1.4
    this._burst(r.x, r.y, '#ff6b6b', 10)
    if (r.hp <= 0) {
      r.lives -= 1
      this.emit('life', r.lives)
      if (r.lives <= 0) this._gameOver()
      else { r.hp = r.maxHp; r.invuln = 2.0 }
    }
  }

  _applyPowerup(kind) {
    const r = this.rocket
    if (kind === 'shield') r.shield = Math.min(r.shield + 1, 3)
    else { r.weapon = kind; r.weaponTime = 8 }
    this.emit('powerup', kind)
  }

  _burst(x, y, color, n) {
    const frame = EXPLOSION[1]
    for (let i = 0; i < n && this.particles.length < MAX_PARTICLES; i++) {
      this.particles.push(makeParticle(x, y, frame[i % frame.length], color))
    }
  }

  _progress() {
    if (this.state !== 'playing') return
    const allSpawned = this.pi >= this.pending.length
    if (allSpawned && this.enemies.length === 0 && !this.boss && !this.bossSpawned) {
      this.bossSpawned = true
      this.boss = makeBoss(this.w / 2 - 80, -80, this.level)
      this.state = 'boss'
      this.emit('boss', this.level)
    }
  }

  _nextLevel() {
    this.level += 1
    this.state = 'playing'
    this.emit('levelup', this.level)
    this._loadLevel(this.level)
    this.rocket.hp = this.rocket.maxHp
    this.rocket.invuln = 1.5
  }

  _gameOver() {
    this.state = 'gameover'
    if (this.score > this.high) { this.high = this.score; writeHigh(this.high) }
    this.emit('gameover', { score: this.score, level: this.level, high: this.high })
  }
}

// --- helpers ---
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }

function pointInBox(pt, e, cw, lh) {
  const w = spriteCols(e.art) * cw
  const h = e.art.length * lh
  return pt.x >= e.x && pt.x <= e.x + w && pt.y >= e.y && pt.y <= e.y + h
}
const overlapPoint = pointInBox

function readHigh() {
  try { return Number(localStorage.getItem('pi_high') || 0) } catch { return 0 }
}
function writeHigh(v) {
  try { localStorage.setItem('pi_high', String(v)) } catch { /* ignore */ }
}
