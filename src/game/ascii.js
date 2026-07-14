// ASCII sprite art for PORTFOLIO INVADERS.
// Each sprite is an array of text rows. Rendered in a monospace font, so the
// visual box is (maxCols * charW) x (rows * lineH). Keep rows short + uniform.

export const ROCKET = [
  ' /\\ ',
  '<█>',
  ' ⋀ ',
]

// Enemy archetypes. cute = ram/swarm, evil = shoot.
export const ENEMIES = {
  scout: {
    // cute — tiny weaver
    art: ['·o·', '<∙>'],
    color: '#7fe0c0',
    hp: 1,
    speed: 62,
    score: 100,
    evil: false,
    behavior: 'weave',
    fireRate: 0,
  },
  buzzer: {
    // cute — fast swarmer
    art: ['\\••/', '/▿\\'],
    color: '#ffd166',
    hp: 1,
    speed: 96,
    score: 150,
    evil: false,
    behavior: 'dive',
    fireRate: 0,
  },
  grunt: {
    // evil — steady shooter
    art: ['┌▚┐', '╘═╛'],
    color: '#ff6b6b',
    hp: 2,
    speed: 44,
    score: 250,
    evil: true,
    behavior: 'advance',
    fireRate: 1.6,
  },
  hulk: {
    // evil — slow tank
    art: ['╔█▓█╗', '║▓█▓║', '╚╤═╤╝'],
    color: '#c792ea',
    hp: 6,
    speed: 26,
    score: 500,
    evil: true,
    behavior: 'advance',
    fireRate: 2.4,
  },
}

export const BOSS = {
  art: [
    '  ╔══════════╗  ',
    '◄╢▓▒█  ●●  █▒▓╟►',
    ' ╚╤╤╤╤╤╤╤╤╤╤╤╝ ',
    '  ▼  ▼  ▼  ▼   ',
  ],
  color: '#ff3d71',
  score: 3000,
  fireRate: 0.7,
}

export const EXPLOSION = [
  ['·'],
  ['*', '¤', '✦'],
  ['✷', '❋', '＊'],
  ['░', '▒', '·'],
]

export const PLAYER_BULLET = '│'
export const ENEMY_BULLET = '︙'
export const POWERUP = { art: ['◈'], colors: { rapid: '#7fe0c0', shield: '#7db8ff', spread: '#ffd166' } }

export const ENEMY_KEYS = Object.keys(ENEMIES)
