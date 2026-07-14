import { describe, it, expect } from 'vitest'
import { Engine } from './engine.js'

// jsdom-free: engine is pure logic. localStorage may be undefined → engine guards it.
const noInput = {
  axisX: () => 0, axisY: () => 0, firing: () => false,
  takePressed: () => false,
}
function firingInput() { return { ...noInput, firing: () => true } }

function newEngine(onEvent = () => {}) {
  return new Engine({ width: 800, height: 600, cw: 10, lh: 18, onEvent })
}

// a still enemy (no drift) at a fixed spot, for deterministic collision tests
function stillEnemy(x, y) {
  return {
    kind: 'enemy', type: 'test', art: ['##'], color: '#fff', x, y, hp: 1,
    spec: { score: 100, evil: false, behavior: 'advance', fireRate: 0, speed: 0 },
    t: 0, fireT: 0, baseX: x,
  }
}

describe('Engine setup', () => {
  it('starts in tutorial and switches to playing on start()', () => {
    const e = newEngine()
    expect(e.state).toBe('tutorial')
    e.start()
    expect(e.state).toBe('playing')
    expect(e.pending.length).toBeGreaterThan(0)
  })

  it('places the rocket near the bottom center', () => {
    const e = newEngine()
    expect(e.rocket.y).toBeGreaterThan(400)
    expect(e.rocket.lives).toBe(3)
  })
})

describe('firing', () => {
  it('spawns a player bullet on fire, gated by cooldown', () => {
    const e = newEngine()
    e.start()
    e.pending = [] // no auto-spawns interfering
    e.step(0.016, firingInput())
    expect(e.bullets.length).toBe(1)
    e.step(0.016, firingInput()) // still cooling down
    expect(e.bullets.length).toBe(1)
    e.rocket.cooldown = 0 // cooldown elapsed
    e.step(0.016, firingInput())
    expect(e.bullets.length).toBe(2)
  })
})

describe('combat + scoring', () => {
  it('kills an enemy, scores, and counts the kill', () => {
    const e = newEngine()
    e.start()
    e.pending = []
    e.enemies = [stillEnemy(100, 100)]
    e.bullets = [{ kind: 'bullet', x: 105, y: 115, vx: 0, vy: -500, owner: 'player' }]
    const before = e.score
    e.step(0.016, noInput)
    expect(e.enemies.length).toBe(0)
    expect(e.score).toBe(before + 100)
    expect(e.kills).toBe(1)
  })

  it('emits a discovery after enough kills and pauses', () => {
    const events = []
    const e = newEngine((t, d) => events.push([t, d]))
    e.start()
    e.pending = []
    e.killsSinceDiscovery = 5
    e.enemies = [stillEnemy(100, 100)]
    e.bullets = [{ kind: 'bullet', x: 105, y: 115, vx: 0, vy: -500, owner: 'player' }]
    e.step(0.016, noInput)
    expect(e.state).toBe('discovery')
    expect(events.some(([t]) => t === 'discovery')).toBe(true)
    e.resumeFromDiscovery()
    expect(e.state).toBe('playing')
  })
})

describe('lives + game over', () => {
  it('loses a life when hit with no hp, and ends at zero lives', () => {
    const events = []
    const e = newEngine((t, d) => events.push([t, d]))
    e.start()
    e.rocket.lives = 1
    e.rocket.hp = 1
    e.rocket.invuln = 0
    e._hitRocket()
    expect(e.rocket.hp).toBeLessThanOrEqual(0)
    expect(e.state).toBe('gameover')
    expect(events.some(([t]) => t === 'gameover')).toBe(true)
  })

  it('does not take damage while invulnerable', () => {
    const e = newEngine()
    e.start()
    e.rocket.invuln = 1
    e.rocket.hp = 3
    e.eBullets = [{ kind: 'bullet', x: e.rocket.x + 5, y: e.rocket.y + 5, vx: 0, vy: 100, owner: 'enemy' }]
    e._collisions()
    expect(e.rocket.hp).toBe(3)
  })
})

describe('boss progression', () => {
  it('spawns a boss once all waves are cleared', () => {
    const e = newEngine()
    e.start()
    e.pi = e.pending.length // all spawned
    e.enemies = []
    e.step(0.016, noInput)
    expect(e.boss).toBeTruthy()
    expect(e.state).toBe('boss')
  })

  it('advances to the next level when the boss dies', () => {
    const e = newEngine()
    e.start()
    const lvl = e.level
    e.boss = { kind: 'boss', art: ['x'], color: '#fff', x: 100, y: 100, hp: 1, maxHp: 1, spec: { score: 3000, fireRate: 1 }, t: 0, fireT: 99, dir: 1 }
    e.bullets = [{ kind: 'bullet', x: 100, y: 100, vx: 0, vy: -500, owner: 'player' }]
    e.state = 'boss'
    e._collisions()
    expect(e.boss).toBe(null)
    expect(e.level).toBe(lvl + 1)
    expect(e.state).toBe('playing')
  })
})
