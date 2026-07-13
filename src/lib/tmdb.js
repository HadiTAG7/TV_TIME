// TMDB API client. Works with either a v3 API key (32-char hex) passed as
// ?api_key= or a v4 read-access token (JWT) passed as a Bearer header.
const BASE = 'https://api.themoviedb.org/3'
export const IMG = (path, size = 'w342') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : ''

// Catalog data (titles, episode names, overviews) is always fetched in
// English regardless of the UI language — per the owner's preference.
function langParam() {
  return 'en-US'
}

async function call(path, params, { key }) {
  const url = new URL(BASE + path)
  const isBearer = key.includes('.')
  if (!isBearer) url.searchParams.set('api_key', key)
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

// Most popular shows currently watchable on a given streaming platform.
export async function discoverTvByProvider(providerId, auth, region = 'SA') {
  const data = await call('/discover/tv', {
    with_watch_providers: providerId,
    watch_region: region,
    sort_by: 'popularity.desc',
    include_adult: 'false',
  }, auth)
  return (data.results || []).slice(0, 12).map(normTvSummary)
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
