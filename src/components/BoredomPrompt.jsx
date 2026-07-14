import { useEffect, useState } from 'react'

// Slides in after a stretch of idle time on any page: "feeling bored?"
// Dismissing it stops the nagging for the session.
function BoredomPrompt({ onStart }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('pi_dismissed')) return
    let timer
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setShow(true), 5000)
    }
    const reset = () => { if (!show) arm() }
    arm()
    window.addEventListener('mousemove', reset, { passive: true })
    window.addEventListener('keydown', reset)
    window.addEventListener('scroll', reset, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('keydown', reset)
      window.removeEventListener('scroll', reset)
    }
  }, [show])

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem('pi_dismissed', '1')
  }

  if (!show) return null
  return (
    <div className="pi-prompt" role="dialog" aria-label="secret game">
      <div className="pi-prompt-body">
        <span className="pi-prompt-tag">TRANSMISSION</span>
        <p className="pi-prompt-line">does this page feel a little… static?</p>
        <div className="pi-prompt-actions">
          <button className="pi-prompt-go" onClick={onStart}>make it interesting ↗</button>
          <button className="pi-prompt-no" onClick={dismiss}>no, i'm fine</button>
        </div>
      </div>
    </div>
  )
}

export default BoredomPrompt
