// Vercel serverless function: proxies Trakt.tv API calls so the client id
// lives only in the TRAKT_CLIENT_ID environment variable, never in the client
// bundle. Mirrors api/tmdb.js, except Trakt authenticates with *headers*
// rather than a query param.
// GET /api/trakt?p=/shows/the-wire/seasons/1/episodes/1/comments/likes
export default async function handler(req, res) {
  const clientId = process.env.TRAKT_CLIENT_ID
  if (!clientId) {
    res.status(500).json({ error: 'TRAKT_CLIENT_ID is not configured' })
    return
  }
  const { p = '', ...query } = req.query
  // Same shape as the TMDB proxy, plus an explicit `..` guard so a crafted
  // path can't climb out of the API root.
  if (!/^\/[\w/.-]+$/.test(p) || p.includes('..')) {
    res.status(400).json({ error: 'bad path' })
    return
  }
  const url = new URL('https://api.trakt.tv' + p)
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v))

  let upstream
  try {
    upstream = await fetch(url, {
      headers: {
        'trakt-api-key': clientId,
        'trakt-api-version': '2',
        'Content-Type': 'application/json',
        // Required: Trakt sits behind Cloudflare, which WAF-blocks requests
        // that arrive without a User-Agent (verified — bare requests get an
        // HTML "you have been blocked" page, any UA passes through).
        'User-Agent': 'CineTrack/1.0 (+https://tv-time-mu.vercel.app)',
        Accept: 'application/json',
      },
    })
  } catch {
    res.status(502).json({ error: 'trakt unreachable' })
    return
  }

  const body = await upstream.text()
  res.status(upstream.status)
  res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
  const count = upstream.headers.get('x-pagination-item-count')
  if (count) res.setHeader('x-pagination-item-count', count)
  // Comments change slowly — let Vercel's edge cache absorb repeat views.
  res.setHeader('cache-control', 's-maxage=1800, stale-while-revalidate=86400')
  res.send(body)
}
