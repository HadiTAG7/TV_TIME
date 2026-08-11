// Builds the "الشائع" rows from data that reflects reality:
//   - Global   : what's trending worldwide this week, ungrouped.
//   - Netflix  : Netflix's own published Top 10 for the region, ranks included.
//   - Local    : trending shows grouped by the services that actually stream
//                them in the region.
//   - Elsewhere: the big platforms that don't operate in the region (Disney+,
//                HBO Max…), grouped from a reference region and clearly
//                labelled, so the catalogue is still browsable.
// Nothing is hardcoded per platform: the groupings come from the data, so a
// service that launches locally moves rows on its own.
import { trendingTv, watchProvidersForTv, providerDirectory, searchTvByTitle } from './tmdb.js'

export const REGION = 'SA'
// Reference market used to surface platforms with no local presence. One
// providers call already returns every country, so this is free.
export const FALLBACK_REGION = 'US'
export const NETFLIX_ID = 8

const PROV_KEY = 'cinetrack.provmap.v2' // v2: stores several regions per show
const PROV_TTL = 7 * 24 * 60 * 60 * 1000 // availability moves slowly
const TITLE_KEY = 'cinetrack.titlemap.v1'
const TITLE_TTL = 30 * 24 * 60 * 60 * 1000
const TRENDING_PAGES = 2
const GLOBAL_ROW_SIZE = 15
const MIN_ROW = 2 // a one-item row looks broken; hide it
const MAX_ELSEWHERE_ROWS = 4 // keep the unavailable-here section from sprawling

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
  const map = await watchProvidersForTv(show.tmdbId, auth, [REGION, FALLBACK_REGION])
  writeMap(PROV_KEY, String(show.tmdbId), map)
  return map
}

// TMDB gives the same brand different provider ids per country (Prime Video is
// 119 in SA but 9 in the US), so de-duplication has to compare names too.
const brand = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')

// TMDB also lists resold add-ons ("HBO Max Amazon Channel", "Paramount+ Roku
// Premium Channel") alongside the real services. They're the same catalogue
// behind someone else's billing, so they only crowd out the actual platform.
const isResoldChannel = (name) =>
  /\b(channel|channels)\b/i.test(name || '') && /amazon|apple|roku|prime video|verizon/i.test(name || '')

// Group shows by provider, preserving the order they trended in.
function groupBy(shows, listFor, directory, { skip = new Set(), skipNames = new Set() } = {}) {
  const groups = new Map()
  shows.forEach((show, i) => {
    for (const prov of listFor(i) || []) {
      if (skip.has(prov.id)) continue
      const label = directory[prov.id]?.name || prov.name
      if (isResoldChannel(label)) continue
      if (skipNames.has(brand(label))) continue
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

// -> { global, local, elsewhere }
export async function buildPlatformRows(auth) {
  const pages = await Promise.all(
    Array.from({ length: TRENDING_PAGES }, (_, i) => trendingTv(auth, i + 1).catch(() => []))
  )
  const shows = pages.flat()
  if (!shows.length) return { global: [], local: [], elsewhere: [] }

  const [localDir, refDir] = await Promise.all([
    providerDirectory(auth, REGION).catch(() => ({})),
    providerDirectory(auth, FALLBACK_REGION).catch(() => ({})),
  ])
  const maps = await pooled(shows, 6, (s) => providersFor(s, auth))

  // Netflix has its own official row, so it is skipped in the grouped rows.
  const local = groupBy(shows, (i) => maps[i]?.[REGION], localDir, { skip: new Set([NETFLIX_ID]) })

  // Platforms with no local presence at all, grouped from the reference market.
  const localIds = new Set(Object.keys(localDir).map(Number))
  const shownIds = new Set(local.map((r) => r.id))
  const localBrands = new Set([
    ...Object.values(localDir).map((p) => brand(p.name)),
    ...local.map((r) => brand(r.name)),
  ])
  const elsewhere = groupBy(shows, (i) => maps[i]?.[FALLBACK_REGION], refDir, {
    skip: new Set([...localIds, ...shownIds, NETFLIX_ID]),
    skipNames: localBrands,
  }).slice(0, MAX_ELSEWHERE_ROWS)

  return { global: shows.slice(0, GLOBAL_ROW_SIZE), local, elsewhere }
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
