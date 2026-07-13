import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { demoShows, demoMovies, DEMO_SEED } from './lib/demo.js'
import * as tmdb from './lib/tmdb.js'
import * as cloud from './lib/cloud.js'
import * as fb from './lib/firebase.js'
import { mergeStates, serializeForSync } from './lib/sync.js'
import { makeT, detectLang } from './i18n.js'

const KEY = 'cinetrack.v1'
const DAY = 24 * 60 * 60 * 1000

// Default TMDB API key (owner's personal key) so the app works with the real
// catalog out of the box. Replaceable anytime in Profile → Settings. In proxy
// mode (Vercel) the key lives server-side only, so the literal below is
// dead-code-eliminated out of that bundle entirely.
const DEFAULT_TMDB_KEY = tmdb.TMDB_PROXY ? '' : 'f94c13fa0f72c474c7761aa22491008d'

/* ───────────────────────── persistence & seeding ───────────────────────── */

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const st = JSON.parse(raw)
      // Installs from before the key was bundled get it filled in.
      if (!st.settings.tmdbKey) st.settings.tmdbKey = DEFAULT_TMDB_KEY
      if (!st.deleted) st.deleted = { shows: {}, movies: {} }
      return st
    }
  } catch { /* corrupted storage falls through to a fresh seed */ }
  return seedState()
}

function seedState() {
  const shows = {}
  const movies = {}
  const catalogShows = Object.fromEntries(demoShows().map((s) => [s.id, s]))
  const catalogMovies = Object.fromEntries(demoMovies().map((m) => [m.id, m]))
  let clock = Date.now() - 200 * DAY

  for (const seed of DEMO_SEED.shows) {
    const c = catalogShows[seed.id]
    if (!c) continue
    const watched = {}
    for (const season of c.seasons) {
      const upTo = seed.watchedThrough[season.n] || 0
      for (const ep of season.episodes) {
        if (ep.n <= upTo) {
          watched[`${season.n}:${ep.n}`] = clock
          clock += 0.4 * DAY
        }
      }
    }
    shows[c.id] = {
      ...c, status: seed.status, watched, rating: seed.rating || 0,
      source: 'demo', addedAt: Date.now() - 180 * DAY, updatedAt: clock,
    }
  }
  for (const seed of DEMO_SEED.movies) {
    const c = catalogMovies[seed.id]
    if (!c) continue
    movies[c.id] = {
      ...c, status: seed.status, rating: seed.rating || 0,
      watchedAt: seed.status === 'watched' ? clock - 30 * DAY : 0,
      source: 'demo', addedAt: Date.now() - 150 * DAY,
    }
  }
  return {
    settings: {
      lang: detectLang(), tmdbKey: DEFAULT_TMDB_KEY, name: 'Cinema Fan', tagline: '',
      syncToken: '', gistId: '', syncUser: '', settingsUpdatedAt: 0,
    },
    shows,
    movies,
    deleted: { shows: {}, movies: {} },
    seededAt: Date.now(),
  }
}

/* ───────────────────────────── derived helpers ─────────────────────────── */

export function showProgress(show) {
  const today = new Date().toISOString().slice(0, 10)
  let totalEps = 0
  let watchedEps = 0
  let nextEp = null // first aired-but-unwatched episode
  let nextAiring = null // first future episode
  let currentSeason = show.seasons[0]?.n || 1

  for (const season of show.seasons) {
    for (const ep of season.episodes) {
      totalEps++
      const isWatched = show.watched[`${season.n}:${ep.n}`]
      if (isWatched) {
        watchedEps++
        currentSeason = season.n
      } else {
        // An episode airing today is both watchable (nextEp) and upcoming
        // (nextAiring) so it shows in "Today" and can still be checked off.
        if (!nextEp && ep.air && ep.air <= today) nextEp = { season: season.n, ep }
        if (!nextAiring && ep.air && ep.air >= today) nextAiring = { season: season.n, ep }
      }
    }
  }
  if (nextEp) currentSeason = nextEp.season
  const seasonObj = show.seasons.find((s) => s.n === currentSeason) || show.seasons[0]
  const seasonTotal = seasonObj?.episodes.length || 0
  const seasonWatched = seasonObj
    ? seasonObj.episodes.filter((e) => show.watched[`${seasonObj.n}:${e.n}`]).length
    : 0
  const pct = seasonTotal ? Math.round((seasonWatched / seasonTotal) * 100) : 0
  return { totalEps, watchedEps, currentSeason, seasonWatched, seasonTotal, pct, nextEp, nextAiring }
}

export function upcomingFor(shows) {
  const out = []
  for (const show of Object.values(shows)) {
    if (show.status === 'completed' || show.status === 'dropped') continue
    const { nextAiring } = showProgress(show)
    if (nextAiring) out.push({ show, ...nextAiring })
  }
  out.sort((a, b) => a.ep.air.localeCompare(b.ep.air))
  return out
}

export function computeStats(state) {
  let episodesWatched = 0
  let totalMinutes = 0
  let ratedCount = 0
  let completedShows = 0
  for (const show of Object.values(state.shows)) {
    const runtimeBySeasonEp = {}
    for (const s of show.seasons)
      for (const e of s.episodes) runtimeBySeasonEp[`${s.n}:${e.n}`] = e.runtime || show.episodeRunTime || 40
    const count = Object.keys(show.watched).length
    episodesWatched += count
    for (const k of Object.keys(show.watched))
      totalMinutes += runtimeBySeasonEp[k] || show.episodeRunTime || 40
    if (show.rating) ratedCount++
    if (show.status === 'completed') completedShows++
  }
  let moviesWatched = 0
  for (const m of Object.values(state.movies)) {
    if (m.status === 'watched') {
      moviesWatched++
      totalMinutes += m.runtime || 100
    }
    if (m.rating) ratedCount++
  }
  return {
    moviesWatched,
    showsTracked: Object.keys(state.shows).length,
    episodesWatched,
    totalMinutes,
    ratedCount,
    completedShows,
    titlesTracked: Object.keys(state.shows).length + Object.keys(state.movies).length,
  }
}

export function computeAchievements(stats) {
  return [
    { id: 'firstSteps', icon: 'flag', nameKey: 'achFirstSteps', descKey: 'achFirstStepsDesc', unlocked: stats.episodesWatched >= 1 },
    { id: 'critic', icon: 'star', nameKey: 'achCritic', descKey: 'achCriticDesc', unlocked: stats.ratedCount >= 10 },
    { id: 'marathoner', icon: 'local_fire_department', nameKey: 'achMarathoner', descKey: 'achMarathonerDesc', unlocked: stats.episodesWatched >= 100 },
    { id: 'reviewer', icon: 'movie_edit', nameKey: 'achMovieBuff', descKey: 'achMovieBuffDesc', unlocked: stats.moviesWatched >= 25 },
    { id: 'finisher', icon: 'verified', nameKey: 'achFinisher', descKey: 'achFinisherDesc', unlocked: stats.completedShows >= 5 },
    { id: 'collector', icon: 'stacks', nameKey: 'achCollector', descKey: 'achCollectorDesc', unlocked: stats.titlesTracked >= 20 },
    { id: 'seriesAddict', icon: 'tv_signin', nameKey: 'achSeriesAddict', descKey: 'achSeriesAddictDesc', unlocked: stats.episodesWatched >= 500 },
    { id: 'timeLord', icon: 'hourglass_top', nameKey: 'achTimeLord', descKey: 'achTimeLordDesc', unlocked: stats.totalMinutes >= 7 * 24 * 60 },
  ]
}

export function watchHistory(state, limit = 30) {
  const items = []
  for (const show of Object.values(state.shows)) {
    for (const [key, ts] of Object.entries(show.watched)) {
      const [s, e] = key.split(':').map(Number)
      items.push({ kind: 'episode', ts, show, s, e })
    }
  }
  for (const m of Object.values(state.movies))
    if (m.status === 'watched' && m.watchedAt) items.push({ kind: 'movie', ts: m.watchedAt, movie: m })
  items.sort((a, b) => b.ts - a.ts)
  return items.slice(0, limit)
}

export function topGenres(state, limit = 6) {
  const counts = {}
  for (const item of [...Object.values(state.shows), ...Object.values(state.movies)])
    for (const g of item.genres || []) counts[g] = (counts[g] || 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit)
}

/* ─────────────────────────────── the provider ───────────────────────────── */

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [syncInfo, setSyncInfo] = useState({ status: 'idle', at: 0, error: '' })
  const [fbUser, setFbUser] = useState(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const fbUserRef = useRef(null)
  fbUserRef.current = fbUser
  const syncRef = useRef({ lastSnap: '', busy: false, timer: 0 })

  // Track Firebase auth state (no-op when Firebase isn't configured).
  useEffect(() => {
    let unsub = () => {}
    fb.watchAuth((user) => setFbUser(user)).then((u) => { unsub = u })
    return () => unsub()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch { /* storage full/unavailable — app keeps working in memory */ }
  }, [state])

  // ── cloud sync: pull remote → merge → push if anything changed ──
  // Two interchangeable backends share the same merge path: Firestore
  // (when Firebase is configured and the user signed in with Google)
  // takes precedence, otherwise the GitHub Gist token if connected.
  const doSync = useCallback(async () => {
    const st = stateRef.current
    const user = fbUserRef.current
    const token = st.settings.syncToken
    const provider = fb.firebaseEnabled && user ? 'firebase' : token ? 'gist' : null
    if (!provider || syncRef.current.busy) return
    syncRef.current.busy = true
    setSyncInfo((s) => ({ ...s, status: 'syncing' }))
    try {
      let remoteRaw
      let push
      let gistId = st.settings.gistId
      if (provider === 'firebase') {
        remoteRaw = await fb.pullCloud(user.uid)
        push = (snap) => fb.pushCloud(user.uid, snap)
      } else {
        if (!gistId) gistId = await cloud.findOrCreateGist(token)
        remoteRaw = await cloud.pullGist(token, gistId)
        push = (snap) => cloud.pushGist(token, gistId, snap)
      }
      let remote = null
      try { remote = remoteRaw ? JSON.parse(remoteRaw) : null } catch { remote = null }

      let merged = remote ? mergeStates(st, remote) : st
      if (provider === 'gist' && gistId !== st.settings.gistId) {
        merged = { ...merged, settings: { ...merged.settings, gistId } }
      }
      const snap = serializeForSync(merged)
      if (snap !== serializeForSync(st) || gistId !== st.settings.gistId) setState(merged)
      const remoteSnap = remote ? serializeForSync({ ...remote, settings: remote.settings || {} }) : ''
      if (snap !== remoteSnap) await push(snap)
      syncRef.current.lastSnap = snap
      setSyncInfo({ status: 'ok', at: Date.now(), error: '' })
    } catch (e) {
      setSyncInfo((s) => ({ ...s, status: 'error', error: String(e.message || e) }))
    } finally {
      syncRef.current.busy = false
    }
  }, [])

  const syncEnabled = (fb.firebaseEnabled && !!fbUser) || !!state.settings.syncToken

  // Debounced push after any local change.
  useEffect(() => {
    if (!syncEnabled) return
    if (serializeForSync(state) === syncRef.current.lastSnap) return
    clearTimeout(syncRef.current.timer)
    syncRef.current.timer = setTimeout(doSync, 4000)
    return () => clearTimeout(syncRef.current.timer)
  }, [state, syncEnabled, doSync])

  // On app open, refresh TMDB metadata for every tracked show (each show is
  // throttled to once per 12h inside refreshShow; English-title migration
  // bypasses the throttle once).
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const id of Object.keys(stateRef.current.shows)) actionsRef.current?.refreshShow(id)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Pull when the app opens, becomes visible again, and every 5 minutes.
  useEffect(() => {
    if (!syncEnabled) return
    doSync()
    const onVisible = () => { if (document.visibilityState === 'visible') doSync() }
    document.addEventListener('visibilitychange', onVisible)
    const interval = setInterval(doSync, 5 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(interval)
    }
  }, [syncEnabled, doSync])

  useEffect(() => {
    document.documentElement.lang = state.settings.lang
    document.documentElement.dir = state.settings.lang === 'ar' ? 'rtl' : 'ltr'
  }, [state.settings.lang])

  const t = useMemo(() => makeT(state.settings.lang), [state.settings.lang])
  const auth = useMemo(
    () => ({ key: state.settings.tmdbKey.trim(), lang: state.settings.lang }),
    [state.settings.tmdbKey, state.settings.lang]
  )
  const hasKey = !!auth.key || tmdb.TMDB_PROXY

  // silent: background metadata refreshes don't bump updatedAt, so they never
  // win sync conflicts against real user edits from another device.
  const patchShow = useCallback((id, patch, { silent = false } = {}) => {
    setState((st) => {
      const show = st.shows[id]
      if (!show) return st
      const next = typeof patch === 'function' ? patch(show) : patch
      return {
        ...st,
        shows: {
          ...st.shows,
          [id]: { ...show, ...next, updatedAt: silent ? show.updatedAt : Date.now() },
        },
      }
    })
  }, [])

  const actions = useMemo(() => ({
    updateSettings(patch) {
      setState((st) => ({
        ...st,
        settings: { ...st.settings, ...patch, settingsUpdatedAt: Date.now() },
      }))
    },

    // ── cloud sync ──
    syncNow: doSync,

    async signInGoogle() {
      await fb.signInGoogle()
      // onAuthStateChanged flips fbUser, which triggers the initial pull.
    },

    async signOutGoogle() {
      await fb.signOutGoogle()
      syncRef.current.lastSnap = ''
      setSyncInfo({ status: 'idle', at: 0, error: '' })
    },

    async connectSync(token) {
      const login = await cloud.validateToken(token.trim())
      setState((st) => ({
        ...st,
        settings: { ...st.settings, syncToken: token.trim(), syncUser: login, gistId: '' },
      }))
      return login
    },

    disconnectSync() {
      setState((st) => ({
        ...st,
        settings: { ...st.settings, syncToken: '', gistId: '', syncUser: '' },
      }))
      setSyncInfo({ status: 'idle', at: 0, error: '' })
    },

    // `item` is a catalog entry (demo or TMDB summary). TMDB shows get full
    // season data fetched before insert so episode tracking works offline after.
    async addShow(item, status = 'watching') {
      let full = item
      if (item.source === 'tmdb' && !item.seasons) full = await tmdb.tvDetails(item.tmdbId, auth)
      setState((st) => st.shows[full.id] ? st : {
        ...st,
        shows: {
          ...st.shows,
          [full.id]: {
            ...full, status, watched: {}, rating: 0,
            dataLang: 'en', addedAt: Date.now(), updatedAt: Date.now(),
          },
        },
      })
      return full.id
    },

    async addMovie(item, status = 'watchlist') {
      let full = item
      if (item.source === 'tmdb' && item.runtime == null) full = await tmdb.movieDetails(item.tmdbId, auth)
      setState((st) => st.movies[full.id] ? st : {
        ...st,
        movies: {
          ...st.movies,
          [full.id]: {
            ...full, status, rating: 0,
            watchedAt: status === 'watched' ? Date.now() : 0,
            addedAt: Date.now(), updatedAt: Date.now(),
          },
        },
      })
      return full.id
    },

    removeShow(id) {
      setState((st) => {
        const shows = { ...st.shows }
        delete shows[id]
        // tombstone so the removal reaches other synced devices
        const deleted = { ...st.deleted, shows: { ...st.deleted?.shows, [id]: Date.now() } }
        return { ...st, shows, deleted }
      })
    },

    removeMovie(id) {
      setState((st) => {
        const movies = { ...st.movies }
        delete movies[id]
        const deleted = { ...st.deleted, movies: { ...st.deleted?.movies, [id]: Date.now() } }
        return { ...st, movies, deleted }
      })
    },

    setShowStatus(id, status) { patchShow(id, { status }) },
    rateShow(id, rating) { patchShow(id, { rating }) },

    toggleEpisode(id, s, e) {
      patchShow(id, (show) => {
        const watched = { ...show.watched }
        const k = `${s}:${e}`
        if (watched[k]) delete watched[k]
        else watched[k] = Date.now()
        return { watched }
      })
    },

    markSeason(id, s, on) {
      patchShow(id, (show) => {
        const watched = { ...show.watched }
        const season = show.seasons.find((x) => x.n === s)
        for (const ep of season?.episodes || []) {
          const k = `${s}:${ep.n}`
          if (on) watched[k] = watched[k] || Date.now()
          else delete watched[k]
        }
        return { watched }
      })
    },

    // Mark every episode from the start of the show up to and including
    // (s, e) — all previous seasons too. Existing timestamps are kept.
    markThrough(id, s, e) {
      patchShow(id, (show) => {
        const watched = { ...show.watched }
        for (const season of show.seasons) {
          if (season.n > s) continue
          for (const ep of season.episodes) {
            if (season.n === s && ep.n > e) continue
            const k = `${season.n}:${ep.n}`
            watched[k] = watched[k] || Date.now()
          }
        }
        return { watched }
      })
    },

    // "I already watched this whole show" — marks every already-aired
    // episode across every season. Does NOT force a 'completed' status:
    // bucketOf() derives the real bucket from progress + the show's actual
    // airing status, so a still-running show correctly lands in "Up to
    // Date" rather than being falsely called finished. Clears any prior
    // dropped/completed override so auto-tracking resumes. Unaired
    // episodes are left alone so Upcoming and stats stay honest; existing
    // timestamps are kept.
    markAllWatched(id) {
      patchShow(id, (show) => {
        const today = new Date().toISOString().slice(0, 10)
        const watched = { ...show.watched }
        for (const season of show.seasons) {
          for (const ep of season.episodes) {
            if (ep.air && ep.air > today) continue
            const k = `${season.n}:${ep.n}`
            watched[k] = watched[k] || Date.now()
          }
        }
        return { watched, status: 'watching' }
      })
    },

    // Mark the next aired-but-unwatched episode (poster quick action).
    markNext(id) {
      patchShow(id, (show) => {
        const { nextEp } = showProgress(show)
        if (!nextEp) return {}
        return { watched: { ...show.watched, [`${nextEp.season}:${nextEp.ep.n}`]: Date.now() } }
      })
    },

    setMovieStatus(id, status) {
      setState((st) => {
        const m = st.movies[id]
        if (!m) return st
        return {
          ...st,
          movies: {
            ...st.movies,
            [id]: {
              ...m, status,
              watchedAt: status === 'watched' ? (m.watchedAt || Date.now()) : 0,
              updatedAt: Date.now(),
            },
          },
        }
      })
    },

    rateMovie(id, rating) {
      setState((st) => ({
        ...st,
        movies: { ...st.movies, [id]: { ...st.movies[id], rating, updatedAt: Date.now() } },
      }))
    },

    // Refresh metadata for a TMDB show (new episodes air over time). Also
    // migrates titles fetched in other languages to English (dataLang).
    async refreshShow(id) {
      const show = state.shows[id]
      if (!show || show.source !== 'tmdb' || !hasKey) return
      const fresh = show.refreshedAt && Date.now() - show.refreshedAt < 12 * 60 * 60 * 1000
      if (fresh && show.dataLang === 'en') return
      try {
        const full = await tmdb.tvDetails(show.tmdbId, auth)
        patchShow(id, {
          name: full.name, overview: full.overview, genres: full.genres,
          poster: full.poster || show.poster, backdrop: full.backdrop || show.backdrop,
          network: full.network || show.network,
          seasons: full.seasons, showStatus: full.showStatus, vote: full.vote,
          refreshedAt: Date.now(), dataLang: 'en',
        }, { silent: true })
      } catch { /* offline or rate-limited — stale data is fine */ }
    },

    async search(query) {
      const q = query.trim().toLowerCase()
      if (!q) return []
      if (hasKey) return tmdb.searchMulti(query, auth)
      return [...demoShows(), ...demoMovies()].filter((x) =>
        (x.name || x.title).toLowerCase().includes(q) ||
        (x.genres || []).some((g) => g.toLowerCase().includes(q))
      )
    },

    async trending() {
      if (hasKey) {
        try { return await tmdb.trendingMovies(auth) } catch { /* fall through to demo */ }
      }
      return demoMovies().sort((a, b) => b.vote - a.vote)
    },

    exportData() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `cinetrack-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
    },

    importData(json) {
      const data = JSON.parse(json)
      if (!data.shows || !data.movies || !data.settings) throw new Error('Invalid backup file')
      setState(data)
    },

    resetData() {
      localStorage.removeItem(KEY)
      setState(seedState())
    },
  }), [auth, hasKey, patchShow, state, doSync])
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const value = useMemo(
    () => ({ state, actions, t, hasKey, syncInfo, fbUser }),
    [state, actions, t, hasKey, syncInfo, fbUser]
  )
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  return useContext(AppCtx)
}
