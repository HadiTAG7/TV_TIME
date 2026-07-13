// Pure progress/schedule derivations shared by the app, and by the widget
// payload builder (kept JSX-free so node can unit-test them directly).

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

// Every future (or today) episode across all tracked shows, sorted by air
// date — a TV Time-style schedule where one show can appear several times
// (e.g. the next three weeks of a weekly series).
export function allUpcoming(shows, limit = 50) {
  const today = new Date().toISOString().slice(0, 10)
  const out = []
  for (const show of Object.values(shows)) {
    if (show.status === 'completed' || show.status === 'dropped') continue
    for (const season of show.seasons) {
      for (const ep of season.episodes) {
        if (ep.air && ep.air >= today && !show.watched[`${season.n}:${ep.n}`]) {
          out.push({ show, season: season.n, ep })
        }
      }
    }
  }
  out.sort((a, b) => a.ep.air.localeCompare(b.ep.air))
  return out.slice(0, limit)
}
