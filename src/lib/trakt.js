// Trakt.tv client — community comments on episodes (read-only).
//
// Every call goes through the same-origin /api/trakt serverless function so
// the Trakt client id never ships in the bundle. On static hosts with no
// serverless functions (GitHub Pages) that path returns the SPA's HTML
// instead of JSON; `call()` detects that and throws UNAVAILABLE, which the
// UI renders as a friendly "not available here" state.

const SLUG_KEY = 'cinetrack.traktids.v1'
const SLUG_TTL = 30 * 24 * 60 * 60 * 1000 // ids never change; refresh monthly
const COMMENTS_KEY = 'cinetrack.comments.v1'
const COMMENTS_TTL = 60 * 60 * 1000

export const UNAVAILABLE = 'trakt-unavailable'

// Small keyed localStorage cache: { [sub]: { at, data } }, same envelope
// shape the discover cache in PlatformRows.jsx uses.
function readCache(key, sub, ttl) {
  try {
    const all = JSON.parse(localStorage.getItem(key) || 'null')
    const hit = all?.[sub]
    if (hit && Date.now() - hit.at < ttl) return hit.data
  } catch { /* bad cache — refetch */ }
  return undefined
}

function writeCache(key, sub, data) {
  try {
    const all = JSON.parse(localStorage.getItem(key) || 'null') || {}
    all[sub] = { at: Date.now(), data }
    localStorage.setItem(key, JSON.stringify(all))
  } catch { /* storage full — value still returned from memory */ }
}

async function call(path, params) {
  const url = new URL('/api/trakt', location.origin)
  url.searchParams.set('p', path)
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v)
  const res = await fetch(url)
  const type = res.headers.get('content-type') || ''
  // No serverless function here (static host) → HTML came back, not JSON.
  if (!type.includes('json')) throw new Error(UNAVAILABLE)
  if (!res.ok) throw new Error(`Trakt ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// TMDB id → Trakt slug. Cached for a month: these mappings are stable.
export async function slugForTmdb(tmdbId) {
  const sub = String(tmdbId)
  const cached = readCache(SLUG_KEY, sub, SLUG_TTL)
  if (cached !== undefined) return cached
  const results = await call(`/search/tmdb/${tmdbId}`, { type: 'show' })
  const slug = results?.[0]?.show?.ids?.slug || null
  writeCache(SLUG_KEY, sub, slug)
  return slug
}

function normComment(c) {
  return {
    id: c.id,
    user: c.user?.username || c.user?.name || 'trakt user',
    text: c.comment || '',
    spoiler: !!c.spoiler,
    review: !!c.review,
    likes: c.likes || 0,
    replies: c.replies || 0,
    rating: c.user_rating || 0,
    createdAt: c.created_at || '',
  }
}

// Comments for one episode, most-liked first. Falls back to the show's own
// comment wall when an episode has none of its own (common outside the
// biggest shows), flagged via `scope` so the UI can say which it's showing.
export async function episodeComments(tmdbId, season, ep) {
  const sub = `${tmdbId}:${season}:${ep}`
  const cached = readCache(COMMENTS_KEY, sub, COMMENTS_TTL)
  if (cached !== undefined) return cached

  const slug = await slugForTmdb(tmdbId)
  if (!slug) {
    const empty = { scope: 'episode', comments: [] }
    writeCache(COMMENTS_KEY, sub, empty)
    return empty
  }

  let list = await call(
    `/shows/${slug}/seasons/${season}/episodes/${ep}/comments/likes`,
    { limit: 25 }
  ).catch(() => [])

  let scope = 'episode'
  if (!Array.isArray(list) || list.length === 0) {
    list = await call(`/shows/${slug}/comments/likes`, { limit: 25 }).catch(() => [])
    scope = 'show'
  }

  const out = {
    scope,
    comments: (Array.isArray(list) ? list : []).map(normComment).filter((c) => c.text),
  }
  writeCache(COMMENTS_KEY, sub, out)
  return out
}
