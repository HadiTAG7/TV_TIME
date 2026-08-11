// TMDB API client. Two modes:
// - Proxy mode (VITE_TMDB_PROXY=1, used on Vercel): calls go to the
//   same-origin /api/tmdb serverless function, so no API key ever ships
//   in the client bundle.
// - Direct mode (default, used on GitHub Pages): calls TMDB directly with
//   either a v3 API key (?api_key=) or a v4 read token (Bearer header).
export const TMDB_PROXY = import.meta.env.VITE_TMDB_PROXY === '1'
const BASE = 'https://api.themoviedb.org/3'
export const IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : ''

// Catalog data (titles, episode names, overviews) is always fetched in
// English regardless of the UI language — per the owner's preference.
function langParam() {
  return 'en-US'
}

async function call(path, params, { key } = {}) {
  const url = TMDB_PROXY
    ? new URL('/api/tmdb', location.origin)
    : new URL(BASE + path)
  if (TMDB_PROXY) url.searchParams.set('p', path)
  const isBearer = !TMDB_PROXY && key && key.includes('.')
  if (!TMDB_PROXY && !isBearer && key) url.searchParams.set('api_key', key)
  url.searchParams.set('language', langParam())
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v)
  const res = await fetch(url, {
    headers: isBearer ? { Authorization: `Bearer ${key}` } : {},
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

function normTvSummary(r) {
  return {
    id: `tv-${r.id}`, tmdbId: r.id, type: 'tv', source: 'tmdb',
    name: r.name, year: (r.first_air_date || '').slice(0, 4),
    overview: r.overview, vote: r.vote_average ? +r.vote_average.toFixed(1) : 0,
    poster: IMG(r.poster_path), backdrop: IMG(r.backdrop_path, 'w780'),
    genres: [],
  }
}

function normMovieSummary(r) {
  return {
    id: `movie-${r.id}`, tmdbId: r.id, type: 'movie', source: 'tmdb',
    title: r.title, year: (r.release_date || '').slice(0, 4),
    overview: r.overview, vote: r.vote_average ? +r.vote_average.toFixed(1) : 0,
    poster: IMG(r.poster_path), backdrop: IMG(r.backdrop_path, 'w780'),
    genres: [],
  }
}

export async function searchMulti(query, auth) {
  const data = await call('/search/multi', { query, include_adult: 'false' }, auth)
  return (data.results || [])
    .filter((r) => (r.media_type === 'tv' || r.media_type === 'movie') && (r.poster_path || r.overview))
    .map((r) => (r.media_type === 'tv' ? normTvSummary(r) : normMovieSummary(r)))
}

export async function trendingMovies(auth) {
  const data = await call('/trending/movie/week', {}, auth)
  return (data.results || []).slice(0, 12).map(normMovieSummary)
}

// Viewer reviews for a whole show. TMDB has no per-episode equivalent (that
// endpoint 404s), so these are only ever a show-level fallback.
export async function tvReviews(tmdbId, auth) {
  const data = await call(`/tv/${tmdbId}/reviews`, {}, auth)
  return (data.results || []).map((r) => ({
    id: `tmdb-${r.id}`,
    user: r.author_details?.username || r.author || 'viewer',
    text: r.content || '',
    spoiler: false,
    likes: 0,
    replies: 0,
    rating: r.author_details?.rating || 0,
    createdAt: r.created_at || '',
  })).filter((r) => r.text)
}

// What people are actually watching this week. Deliberately NOT
// /discover/tv?sort_by=popularity.desc — TMDB's `popularity` is a cumulative
// score dominated by long-running back catalogue (it returns The Mentalist and
// Law & Order for "popular on Netflix"), whereas this endpoint is recency
// weighted and matches what viewers would recognise as trending.
export async function trendingTv(auth, page = 1) {
  const data = await call('/trending/tv/week', { page }, auth)
  return (data.results || []).map(normTvSummary)
}

// Subscription ("flatrate") services streaming a show in one region. Rent/buy
// storefronts are excluded on purpose — otherwise Amazon's huge purchase
// catalogue swamps the Prime Video row with titles that aren't on Prime.
export async function watchProvidersForTv(tmdbId, auth, region = 'SA') {
  const data = await call(`/tv/${tmdbId}/watch/providers`, {}, auth)
  const forRegion = data.results?.[region] || {}
  return (forRegion.flatrate || []).map((p) => ({
    id: p.provider_id,
    name: p.provider_name,
    priority: p.display_priority ?? 999,
  }))
}

// The services that genuinely exist in a region, with TMDB's own ordering.
// Used instead of a hand-maintained list, so platforms that aren't available
// (Disney+ and HBO Max are not, in SA) simply never appear.
export async function providerDirectory(auth, region = 'SA') {
  const data = await call('/watch/providers/tv', { watch_region: region }, auth)
  const out = {}
  for (const p of data.results || []) {
    out[p.provider_id] = { name: p.provider_name, priority: p.display_priority ?? 999 }
  }
  return out
}

// Netflix's official chart gives titles as plain text, so they have to be
// matched back to TMDB to get a poster and a trackable id.
export async function searchTvByTitle(title, auth) {
  const data = await call('/search/tv', { query: title, include_adult: 'false' }, auth)
  const hit = (data.results || []).find((r) => r.poster_path) || (data.results || [])[0]
  return hit ? normTvSummary(hit) : null
}

// Full show details with every season's episode list.
// append_to_response accepts up to ~20 sub-requests, so seasons are chunked.
export async function tvDetails(tmdbId, auth) {
  const base = await call(`/tv/${tmdbId}`, {}, auth)
  const seasonNumbers = (base.seasons || [])
    .filter((s) => s.season_number > 0)
    .map((s) => s.season_number)
  const seasons = []
  for (let i = 0; i < seasonNumbers.length; i += 15) {
    const chunk = seasonNumbers.slice(i, i + 15)
    const data = await call(
      `/tv/${tmdbId}`,
      { append_to_response: chunk.map((n) => `season/${n}`).join(',') },
      auth
    )
    for (const n of chunk) {
      const s = data[`season/${n}`]
      if (!s) continue
      seasons.push({
        n,
        episodes: (s.episodes || []).map((e) => ({
          n: e.episode_number,
          name: e.name || `Episode ${e.episode_number}`,
          air: e.air_date || '',
          runtime: e.runtime || base.episode_run_time?.[0] || 40,
        })),
      })
    }
  }
  return {
    ...normTvSummary(base),
    genres: (base.genres || []).map((g) => g.name),
    network: base.networks?.[0]?.name || '',
    airTime: '',
    episodeRunTime: base.episode_run_time?.[0] || 40,
    showStatus: base.status,
    seasons,
  }
}

export async function movieDetails(tmdbId, auth) {
  const data = await call(`/movie/${tmdbId}`, { append_to_response: 'videos' }, auth)
  const trailer = (data.videos?.results || []).find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  )
  return {
    ...normMovieSummary(data),
    genres: (data.genres || []).map((g) => g.name),
    runtime: data.runtime || 0,
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
  }
}
