// Canvas renderer: starfield + ASCII entities. HUD/modals live in React DOM.
import { spriteCols } from './entities.js'

export function measureMono(ctx, fontPx) {
  ctx.font = `${fontPx}px 'IBM Plex Mono', ui-monospace, monospace`
  const cw = ctx.measureText('0').width
  return { cw, lh: Math.round(fontPx * 1.15) }
}

export class Renderer {
  constructor(fontPx = 18) {
    this.fontPx = fontPx
    this.stars = []
    this.w = 0
    this.h = 0
  }

  resize(w, h) {
    this.w = w
    this.h = h
    const count = Math.round((w * h) / 9000)
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 1.7, // depth → speed + brightness
    }))
  }

  draw(ctx, world, dt) {
    const { w, h } = this
    ctx.clearRect(0, 0, w, h)
    ctx.font = `${this.fontPx}px 'IBM Plex Mono', ui-monospace, monospace`
    ctx.textBaseline = 'top'

    // starfield drift
    for (const s of this.stars) {
      s.y += s.z * 26 * dt
      if (s.y > h) { s.y = 0; s.x = Math.random() * w }
      const a = 0.12 + s.z * 0.22
      ctx.fillStyle = `rgba(180, 210, 255, ${a})`
      const size = s.z > 1.2 ? 2 : 1
      ctx.fillRect(s.x, s.y, size, size)
    }

    ctx.shadowBlur = 6

    // powerups
    for (const p of world.powerups) {
      ctx.shadowColor = '#7fe0c0'
      ctx.fillStyle = '#7fe0c0'
      ctx.fillText('◈', p.x, p.y)
    }

    // enemy bullets
    ctx.shadowColor = '#ff6b6b'
    ctx.fillStyle = '#ff8a8a'
    for (const b of world.eBullets) ctx.fillText('︙', b.x, b.y)

    // player bullets
    ctx.shadowColor = '#7fe0c0'
    ctx.fillStyle = '#c7fff0'
    for (const b of world.bullets) ctx.fillText('│', b.x, b.y)

    // enemies
    for (const e of world.enemies) {
      ctx.shadowColor = e.color
      ctx.fillStyle = e.color
      if (e.powerupType) {
        ctx.shadowBlur = 14
        ctx.strokeStyle = powerupColor(e.powerupType)
        ctx.beginPath()
        ctx.arc(e.x + spriteCols(e.art) * ctx.measureText('0').width / 2, e.y + e.art.length * this.fontPx * 0.58, 18, 0, Math.PI * 2)
        ctx.stroke()
      }
      this._sprite(ctx, e.art, e.x, e.y)
      if (e.powerupType) {
        ctx.fillStyle = powerupColor(e.powerupType)
        ctx.font = '12px sans-serif'
        ctx.fillText('✦', e.x + spriteCols(e.art) * ctx.measureText('0').width / 2 - 6, e.y - 10)
        ctx.font = `${this.fontPx}px 'IBM Plex Mono', ui-monospace, monospace`
      }
    }

    // boss + hp bar
    if (world.boss) {
      const boss = world.boss
      ctx.shadowColor = boss.color
      ctx.fillStyle = boss.color
      this._sprite(ctx, boss.art, boss.x, boss.y)
      const wpx = spriteCols(boss.art) * (ctx.measureText('0').width)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(boss.x, boss.y - 12, wpx, 5)
      ctx.fillStyle = boss.color
      ctx.fillRect(boss.x, boss.y - 12, wpx * (boss.hp / boss.maxHp), 5)
      ctx.shadowBlur = 6
    }

    // The player is the site's minimized circular menu hub, not a second ASCII
    // ship. Keep it geometric so it reads like the real navigation control.
    const r = world.rocket
    if (r && !(r.invuln > 0 && Math.floor(r.invuln * 12) % 2)) {
      ctx.shadowColor = '#39f0d0'
      ctx.fillStyle = r.shield > 0 ? '#7db8ff' : '#5ff2d6'
      this._menuHub(ctx, r)
      if (r.shield > 0) {
        ctx.strokeStyle = 'rgba(125,184,255,0.5)'
        ctx.beginPath()
        ctx.ellipse(r.x + 28, r.y + 28, 38, 38, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // particles
    ctx.shadowBlur = 4
    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2))
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.fillText(p.char, p.x, p.y)
    }
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }

  _sprite(ctx, art, x, y) {
    const lh = Math.round(this.fontPx * 1.15)
    for (let i = 0; i < art.length; i++) ctx.fillText(art[i], x, y + i * lh)
  }

  _menuHub(ctx, r) {
    const cx = r.x + 28
    const cy = r.y + 28
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(cx, cy, 27, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(8, 20, 30, 0.94)'
    ctx.fill()
    ctx.strokeStyle = ctx.fillStyle = r.shield > 0 ? '#7db8ff' : '#5ff2d6'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🙭', cx, cy + 1)
    ctx.textAlign = 'start'
    ctx.textBaseline = 'top'
    ctx.font = `${this.fontPx}px 'IBM Plex Mono', ui-monospace, monospace`
    ctx.shadowBlur = 6
  }
}

function powerupColor(type) {
  return { rapid: '#7fe0c0', shield: '#7db8ff', spread: '#ffd166' }[type] || '#fff'
}
