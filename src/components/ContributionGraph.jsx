import { useEffect, useState } from 'react'

function ContributionGraph({ username }) {
  const [cal, setCal] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!username) { setError(true); return }
    fetch(`/api/contributions?user=${encodeURIComponent(username)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCal)
      .catch(() => setError(true))
  }, [username])

  if (error) return <div className="contrib-fallback">contributions unavailable</div>
  if (!cal) return <div className="contrib-fallback">loading contributions…</div>

  return (
    <div className="contrib">
      <div className="contrib-head">
        <span className="contrib-total">{cal.total}</span>
        <span className="contrib-label">contributions this year</span>
      </div>
      <div className="contrib-graph" title={`${cal.total} contributions in the last year`}>
        {cal.weeks.map((week, wi) => (
          <div className="contrib-week" key={wi}>
            {week.days.map((day) => (
              <div
                key={day.date}
                className="contrib-day"
                data-level={day.level}
                title={`${day.date}: ${day.count}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContributionGraph
