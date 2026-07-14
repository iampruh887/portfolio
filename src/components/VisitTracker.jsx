import { useEffect } from 'react'

export default function VisitTracker() {
  useEffect(() => {
    fetch('/api/visit', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer, language: navigator.language }),
      keepalive: true,
    }).catch(() => {})
  }, [])
  return null
}
