// Wave scripting + difficulty. A level is a list of waves; each wave is a burst
// of enemies. Clear all waves -> boss -> next level (denser, faster).
import { ENEMY_KEYS } from './ascii.js'

// Deterministic-ish spread of spawn x positions across the width.
function spread(n, width, margin = 80) {
  const usable = width - margin * 2
  return Array.from({ length: n }, (_, i) => margin + (usable * (i + 0.5)) / n)
}

// Build the wave list for a level. Higher levels: more enemies, tougher mix.
export function buildLevel(level, width) {
  const waves = []
  const rows = 2 + Math.min(level, 3)
  const perRow = 3 + Math.min(level, 4)

  for (let r = 0; r < rows; r++) {
    const xs = spread(perRow + (r % 2), width)
    const enemies = xs.map((x, i) => ({
      type: pickType(level, r, i),
      x,
      y: -60 - r * 46,
      delay: r * 0.6 + i * 0.12,
    }))
    waves.push({ enemies, at: r * (2.2 - Math.min(level * 0.15, 1.0)) })
  }
  return { waves, hasBoss: true }
}

function pickType(level, row, i) {
  if (level >= 2 && row === 0 && i % 4 === 0) return 'hulk'
  if (level >= 1 && (row + i) % 3 === 0) return 'grunt'
  return ENEMY_KEYS[(row + i) % 2 === 0 ? 0 : 1] // scout / buzzer
}

// How many kills between "a wild thing appeared" discoveries.
export const KILLS_PER_DISCOVERY = 6
