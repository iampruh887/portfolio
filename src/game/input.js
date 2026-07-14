// Keyboard input. WASD + arrows to fly, space to shoot, Escape to bail.
// Framework-free: attach() wires listeners, returns a controller you poll each frame.

const MOVE = {
  left: ['a', 'arrowleft'],
  right: ['d', 'arrowright'],
  up: ['w', 'arrowup'],
  down: ['s', 'arrowdown'],
}

export function createInput() {
  const down = new Set()
  const pressed = new Set() // edge-triggered, cleared each poll

  const onKeyDown = (e) => {
    const k = e.key.toLowerCase()
    if (isGameKey(k)) e.preventDefault()
    if (!down.has(k)) pressed.add(k)
    down.add(k)
  }
  const onKeyUp = (e) => { down.delete(e.key.toLowerCase()) }
  const onBlur = () => { down.clear() }

  function isGameKey(k) {
    return k === ' ' || k === 'spacebar' || k === 'escape' ||
      Object.values(MOVE).some((arr) => arr.includes(k))
  }

  return {
    attach() {
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onBlur)
    },
    detach() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      down.clear()
      pressed.clear()
    },
    // axis: -1..1 per frame
    axisX() {
      return (MOVE.right.some((k) => down.has(k)) ? 1 : 0) - (MOVE.left.some((k) => down.has(k)) ? 1 : 0)
    },
    axisY() {
      return (MOVE.down.some((k) => down.has(k)) ? 1 : 0) - (MOVE.up.some((k) => down.has(k)) ? 1 : 0)
    },
    firing() { return down.has(' ') || down.has('spacebar') },
    // consume one-shot presses
    takePressed(k) {
      const hit = pressed.has(k)
      pressed.delete(k)
      return hit
    },
    clearPressed() { pressed.clear() },
  }
}
