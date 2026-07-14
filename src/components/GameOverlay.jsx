import { useState } from 'react'
import BoredomPrompt from './BoredomPrompt.jsx'
import GameStage from './GameStage.jsx'
import '../style/game.css'

// Global host: idle nudge when off, full game when on. Mounted once in App.
export default function GameOverlay() {
  const [active, setActive] = useState(false)
  return active
    ? <GameStage onExit={() => setActive(false)} />
    : <BoredomPrompt onStart={() => setActive(true)} />
}
