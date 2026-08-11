// Builds the "الشائع" rows from data that reflects reality:
//   - Netflix   : Netflix's own published Top 10 for the region, ranks included.
//   - Everything else: the shows genuinely trending this week, grouped by which
//     subscription service actually streams them here.
// Nothing is hardcoded per platform, so services that don't operate in the
// region never show up and new ones appear on their own.
import { trendingTv, watchProvidersForTv, providerDirectory, searchTvByTitle } from './tmdb.js'

export const REGION = 'SA'
export const NETFLIX_ID = 8

const PROV_KEY = 'cinetrack.provmap.v1'
const PROV_TTL = 7 * 24 * 60 * 60 * 1000 // availability moves slowly
const TITLE_KEY = 'cinetrack.titlemap.v1'
const TITLE_TTL = 30 * 24 * 60 * 60 * 1000
const TRENDING_PAGES = 2
const MIN_ROW = 2 // a one-item row looks broken; hide it

function readMap(key, sub, ttl) {
  try {
    const all = JSON.parse(localStorage.getItem(key) || 'null')
    const hit = all?.[sub]
    if (hit && Date.now() - hit.at < ttl) return hit.data
  } catch { /* bad cache — refetch */ }
  return undefined
}

function writeMap(key, sub, data) {
  try {
    const all = JSON.parse(localStorage.getItem(key) || 'null') || {}
    all[sub] = { at: Date.now(), data }
    localStorage.setItem(key, JSON.stringify(all))
  } catch { /* storage full — value still returned from memory */ }
}

// Run tasks a few at a time: 40 simultaneous requests would stall on mobile.
async function pooled(items, limit, worker) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        try { out[i] = await worker(items[i], i) } catch { out[i] = null }
      }
    })
  )
  return out
}

async function providersFor(show, auth) {
  const cached = readMap(PROV_KEY, String(show.tmdbId), PROV_TTL)
  if (cached !== undefined) return cached
  const list = await watchProvidersForTv(show.tmdbId, auth, REGION)
  writeMap(PROV_KEY, String(show.tmdbId), list)
  return list
}

// -> [{ id, name, priority, items: [show] }] excluding Netflix, which gets its
// own official row.
export async function buildPlatformRows(auth) {
  const pages = await Promise.all(
    Array.from({ length: TRENDING_PAGES }, (_, i) => trendingTv(auth, i + 1).catch(() => []))
  )
  const shows = pages.flat()
  if (!shows.length) return []

  const directory = await providerDirectory(auth, REGION).catch(() => ({}))
  const providerLists = await pooled(shows, 6, (s) => providersFor(s, auth))

  const groups = new Map()
  shows.forEach((show, i) => {
    for (const prov of providerLists[i] || []) {
      if (prov.id === NETFLIX_ID) continue // covered by the official row
      if (!groups.has(prov.id)) {
        groups.set(prov.id, {
          id: prov.id,
          name: directory[prov.id]?.name || prov.name,
          priority: directory[prov.id]?.priority ?? prov.priority,
          items: [],
        })
      }
      const g = groups.get(prov.id)
      if (!g.items.some((x) => x.id === show.id)) g.items.push(show)
    }
  })

  return [...groups.values()]
    .filter((g) => g.items.length >= MIN_ROW)
    .sort((a, b) => a.priority - b.priority)
}

// Netflix's published chart for the region, matched to TMDB for posters/ids.
// -> [{ ...show, rank }]
export async function netflixTop10(auth) {
  const res = await fetch(`/api/netflix-top10?country=${REGION}`)
  const type = res.headers.get('content-type') || ''
  if (!type.includes('json')) return [] // static host: no serverless functions
  const data = await res.json()
  const tv = (data.rows || []).filter((r) => r.category === 'TV')
  if (!tv.length) return []

  const matched = await pooled(tv, 4, async (row) => {
    const cached = readMap(TITLE_KEY, row.title, TITLE_TTL)
    const show = cached !== undefined ? cached : await searchTvByTitle(row.title, auth)
    if (cached === undefined) writeMap(TITLE_KEY, row.title, show)
    if (show) return { ...show, rank: row.rank }
    // Some chart entries have no TMDB series (live events like WWE SummerSlam).
    // Keep them so the Top 10 reads 1-10 with no holes, but mark them so the
    // card doesn't pretend to be trackable.
    return { id: `nf-${row.rank}`, name: row.title, rank: row.rank, poster: '', unmatched: true }
  })

  return matched.filter(Boolean).sort((a, b) => a.rank - b.rank)
}
