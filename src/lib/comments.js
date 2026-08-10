// Picks the best community-comment source available for an episode.
//
// Measured reachability from our host (Vercel), which is why the list looks
// the way it does:
//   Trakt    — real per-episode comments for everything, but registering an
//              app now requires paid Trakt VIP, so it only runs when a key
//              has been configured.
//   AniList  — free, key-less, CORS-open. Auto-created "Episode N Discussion"
//              threads with real comments, but anime only.
//   TMDB     — free (key we already have) but show-level reviews only; TMDB
//              has no episode-level endpoint at all.
// Reddit and Bluesky are both network-blocked from Vercel, so neither is
// usable regardless of registration.
import { episodeComments as traktEpisodeComments, UNAVAILABLE } from './trakt.js'
import { animeEpisodeComments } from './anilist.js'
import { tvReviews } from './tmdb.js'

const CACHE_KEY = 'cinetrack.comments.v2'
const CACHE_TTL = 60 * 60 * 1000

// Once Trakt has failed (no key configured), stop retrying it this session.
let traktOff = false

function readCache(sub) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    const hit = all?.[sub]
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data
  } catch { /* bad cache — refetch */ }
  return undefined
}

function writeCache(sub, data) {
  try {
    const all = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') || {}
    all[sub] = { at: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(all))
  } catch { /* storage full — value still returned from memory */ }
}

const isAnime = (show) => (show.genres || []).includes('Animation')

// -> { source: 'trakt'|'anilist'|'tmdb'|null, scope: 'episode'|'show', comments: [] }
export async function fetchEpisodeComments(show, season, epNum, auth) {
  const sub = `${show.id}:${season}:${epNum}`
  const cached = readCache(sub)
  if (cached !== undefined) return cached

  let unavailable = false

  // 1. Trakt — best coverage, needs a configured key.
  if (!traktOff && show.tmdbId) {
    try {
      const r = await traktEpisodeComments(show.tmdbId, season, epNum)
      if (r.comments.length) {
        const out = { source: 'trakt', scope: r.scope, comments: r.comments }
        writeCache(sub, out)
        return out
      }
    } catch (e) {
      if (String(e.message) === UNAVAILABLE) unavailable = true
      traktOff = true
    }
  }

  // 2. AniList — free per-episode threads, anime only.
  if (isAnime(show)) {
    try {
      const comments = await animeEpisodeComments(show.name, epNum)
      if (comments.length) {
        const out = { source: 'anilist', scope: 'episode', comments }
        writeCache(sub, out)
        return out
      }
    } catch { /* fall through to the show-level fallback */ }
  }

  // 3. TMDB — show-level reviews, always available.
  if (show.tmdbId) {
    try {
      const comments = await tvReviews(show.tmdbId, auth)
      if (comments.length) {
        const out = { source: 'tmdb', scope: 'show', comments }
        writeCache(sub, out)
        return out
      }
    } catch { /* nothing left to try */ }
  }

  const empty = { source: null, scope: 'episode', comments: [], unavailable }
  writeCache(sub, empty)
  return empty
}
