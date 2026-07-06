import { normalizeCalendar, CONTRIBUTIONS_QUERY } from './_lib/github.js'

export default async function handler(req, res) {
  const login = String(req.query.user ?? 'iampruh887')
  if (!/^[A-Za-z0-9-]{1,39}$/.test(login)) {
    return res.status(400).json({ error: 'invalid username' })
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: 'GITHUB_TOKEN not configured' })
  }
  try {
    const resp = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login } }),
    })
    const json = await resp.json()
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar
    if (!calendar) return res.status(502).json({ error: 'unexpected github response' })
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json(normalizeCalendar(calendar))
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal error' })
  }
}
