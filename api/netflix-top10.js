// Vercel serverless function: Netflix's OFFICIAL Top 10 for one country.
//
// Netflix publishes weekly per-country rankings as a TSV at tudum.com. It is
// ~31 MB, so it is read as a stream and abandoned as soon as the country's
// rows are behind us (the file is grouped by country). Only the newest week
// is kept, so the response is a handful of rows.
//
// GET /api/netflix-top10            -> Saudi Arabia (default)
// GET /api/netflix-top10?country=AE -> another ISO-3166-1 alpha-2 country
const SOURCE = 'https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv'
const DEFAULT_COUNTRY = 'SA'
const FETCH_BUDGET_MS = 8000

// Exported for unit tests: given TSV lines, keep the newest week for `country`.
// Columns: country_name, country_iso2, week, category, weekly_rank,
//          show_title, season_title, cumulative_weeks_in_top_10
export function parseRows(lines, country) {
  const rows = []
  for (const line of lines) {
    const c = line.split('\t')
    if (c.length < 6) continue
    if (c[1] !== country) continue
    const rank = Number(c[4])
    if (!Number.isFinite(rank)) continue
    rows.push({
      week: c[2],
      // "TV" / "Films" (Netflix also emits localised variants like "TV (Arabic)")
      category: /^tv/i.test(c[3]) ? 'TV' : 'Films',
      rank,
      title: c[5],
      season: c[6] && c[6] !== 'N/A' ? c[6] : '',
    })
  }
  if (!rows.length) return []
  const latest = rows.reduce((a, r) => (r.week > a ? r.week : a), '')
  return rows
    .filter((r) => r.week === latest)
    .sort((a, b) => a.rank - b.rank)
}

export default async function handler(req, res) {
  const raw = String(req.query.country || DEFAULT_COUNTRY).toUpperCase()
  const country = /^[A-Z]{2}$/.test(raw) ? raw : DEFAULT_COUNTRY

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_BUDGET_MS)
  try {
    const upstream = await fetch(SOURCE, {
      signal: ctrl.signal,
      headers: {
        // Netflix serves the file to ordinary clients; a bare agent gets blocked.
        'User-Agent': 'Mozilla/5.0 (compatible; CineTrack/1.0; +https://tv-time-mu.vercel.app)',
        Accept: 'text/plain,*/*',
      },
    })
    if (!upstream.ok || !upstream.body) throw new Error(`upstream ${upstream.status}`)

    // Stream line-by-line and stop once this country's block has passed, so we
    // never buffer the whole 31 MB file.
    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    const lines = []
    let buffer = ''
    let seen = false
    let done = false
    while (!done) {
      const chunk = await reader.read()
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() || ''
      for (const line of parts) {
        const iso = line.split('\t')[1]
        if (iso === country) {
          seen = true
          lines.push(line)
        } else if (seen && iso && iso !== country) {
          // Past this country's block — nothing useful remains.
          done = true
          break
        }
      }
    }
    try { await reader.cancel() } catch { /* already closed */ }
    if (buffer && !done) lines.push(buffer)

    const rows = parseRows(lines, country)
    res.status(200)
    res.setHeader('content-type', 'application/json')
    // Netflix refreshes weekly; a long edge cache keeps the 31 MB read rare.
    res.setHeader('cache-control', 's-maxage=21600, stale-while-revalidate=86400')
    res.send(JSON.stringify({ country, week: rows[0]?.week || '', rows }))
  } catch (e) {
    // Degrade quietly: the client falls back to its TMDB-derived rows.
    res.status(200)
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 's-maxage=60')
    res.send(JSON.stringify({ country, week: '', rows: [], error: String(e.message || e).slice(0, 120) }))
  } finally {
    clearTimeout(timer)
  }
}
