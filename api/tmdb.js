// Vercel serverless function: proxies TMDB API calls so the API key lives
// only in the TMDB_API_KEY environment variable, never in the client bundle.
// GET /api/tmdb?p=/search/multi&query=x  ->  https://api.themoviedb.org/3/search/multi
// (A plain static route — the TMDB path travels in the `p` query param —
// because CLI-uploaded dynamic [...path] routes proved unreliable.)
export default async function handler(req, res) {
  const key = process.env.TMDB_API_KEY
  if (!key) {
    res.status(500).json({ error: 'TMDB_API_KEY is not configured' })
    return
  }
  const { p = '', ...query } = req.query
  if (!/^\/[\w/.-]+$/.test(p)) {
    res.status(400).json({ error: 'bad path' })
    return
  }
  const url = new URL('https://api.themoviedb.org/3' + p)
  for (const [k, v] of Object.entries(query)) {
    if (k !== 'api_key') url.searchParams.set(k, String(v))
  }
  url.searchParams.set('api_key', key)

  const upstream = await fetch(url)
  const body = await upstream.text()
  res.status(upstream.status)
  res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
  // Let Vercel's edge cache absorb repeat discover/trending calls.
  res.setHeader('cache-control', 's-maxage=300, stale-while-revalidate=600')
  res.send(body)
}
