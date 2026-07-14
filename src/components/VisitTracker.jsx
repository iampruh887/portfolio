import { useEffect, useState } from 'react'
import '../style/VisitTracker.css'

const CONSENT_KEY = 'visit_analytics_consent'

export default function VisitTracker() {
  const [consent, setConsent] = useState(() => localStorage.getItem(CONSENT_KEY))
  useEffect(() => {
    if (consent !== 'yes') return
    fetch('/api/visit', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer, language: navigator.language }),
      keepalive: true,
    }).catch(() => {})
  }, [consent])
  if (consent) return null
  const decide = (value) => { localStorage.setItem(CONSENT_KEY, value); setConsent(value) }
  return <aside className="visit-consent" role="dialog" aria-label="Analytics notice">
    <span>This site uses privacy-friendly visit analytics (coarse location, page, and browser details). No names or raw IPs are stored.</span>
    <button onClick={() => decide('yes')}>Allow</button>
    <button className="secondary" onClick={() => decide('no')}>No thanks</button>
  </aside>
}
