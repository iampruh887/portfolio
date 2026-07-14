// Entity factories + geometry. Pure (no canvas) so the engine stays testable.
import { ROCKET, ENEMIES, BOSS, POWERUP } from './ascii.js'

export function spriteCols(art) {
  return art.reduce((m, row) => Math.max(m, row.length), 0)
}

// world.cw / world.lh = char width / line height in px (set by renderer, defaulted in engine)
export function boxOf(e, cw, lh) {
  return { x: e.x, y: e.y, w: spriteCols(e.art) * cw, h: e.art.length * lh }
}

export function overlap(a, b, cw, lh) {
  const ba = boxOf(a, cw, lh)
  const bb = boxOf(b, cw, lh)
  return ba.x < bb.x + bb.w && ba.x + ba.w > bb.x && ba.y < bb.y + bb.h && ba.y + ba.h > bb.y
}

export function makeRocket(x, y) {
  return {
    kind: 'rocket', art: ROCKET, x, y, vx: 0, vy: 0,
    lives: 3, hp: 3, maxHp: 3, invuln: 0, shield: 0,
    cooldown: 0, weapon: 'single', weaponTime: 0,
  }
}

export function makeEnemy(type, x, y, label, powerupType = null) {
  const spec = ENEMIES[type]
  return {
    kind: 'enemy', type, art: label ? labelledArt(spec.art, label) : spec.art,
    color: spec.color, x, y, hp: spec.hp, spec,
    t: Math.random() * Math.PI * 2, fireT: spec.fireRate ? Math.random() * spec.fireRate : 0,
    baseX: x, label: label || null, powerupType,
  }
}

// Give a ship a body built from a real portfolio word (the "content morph").
function labelledArt(baseArt, label) {
  const tag = label.slice(0, 10)
  return [...baseArt, tag]
}

export function makeBoss(x, y, level) {
  return {
    kind: 'boss', art: BOSS.art, color: BOSS.color, x, y,
    hp: 40 + level * 20, maxHp: 40 + level * 20, spec: BOSS,
    t: 0, fireT: 0, dir: 1,
  }
}

export function makeBullet(x, y, vy, owner) {
  return { kind: 'bullet', x, y, vx: 0, vy, owner } // owner: 'player' | 'enemy'
}

export function makeParticle(x, y, char, color) {
  const a = Math.random() * Math.PI * 2
  const s = 40 + Math.random() * 120
  return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, char, color }
}

export function makePowerup(x, y, kind) {
  return { kind: 'powerup', ptype: kind, art: POWERUP.art, x, y, vy: 70 }
}
