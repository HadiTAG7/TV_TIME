// Pure merge logic for cloud sync. Conflict policy:
// - Per title: the copy with the newer updatedAt wins its fields.
// - Episode check-offs are UNIONED so no watched episode is ever lost
//   when two devices diverge.
// - Removals propagate via tombstones in state.deleted ({id: timestamp});
//   a tombstone newer than the item's last update deletes it everywhere,
//   an update newer than the tombstone resurrects the item.
// - Settings: newer settingsUpdatedAt wins, but device-local sync
//   credentials (token/gistId/user) are never taken from the remote copy.

function itemTs(x) {
  return x?.updatedAt || x?.watchedAt || x?.addedAt || 0
}

function mergeItemMaps(lMap = {}, rMap = {}, lDel = {}, rDel = {}) {
  const map = {}
  const del = {}
  const ids = new Set([
    ...Object.keys(lMap), ...Object.keys(rMap),
    ...Object.keys(lDel), ...Object.keys(rDel),
  ])
  for (const id of ids) {
    const l = lMap[id]
    const r = rMap[id]
    const delTs = Math.max(lDel[id] || 0, rDel[id] || 0)
    let item = null
    if (l && r) {
      const winner = itemTs(l) >= itemTs(r) ? l : r
      const loser = winner === l ? r : l
      item = { ...winner }
      if (winner.watched || loser.watched) {
        item.watched = { ...(loser.watched || {}), ...(winner.watched || {}) }
      }
    } else {
      item = l || r
    }
    if (item && delTs > itemTs(item)) {
      del[id] = delTs
    } else if (item) {
      map[id] = item
    } else if (delTs) {
      del[id] = delTs // nothing local to delete, but other devices may still have it
    }
  }
  return { map, del }
}

export function mergeStates(local, remote) {
  if (!remote || (!remote.shows && !remote.movies && !remote.settings)) return local
  const shows = mergeItemMaps(
    local.shows, remote.shows,
    local.deleted?.shows, remote.deleted?.shows
  )
  const movies = mergeItemMaps(
    local.movies, remote.movies,
    local.deleted?.movies, remote.deleted?.movies
  )
  const lS = local.settings || {}
  const rS = remote.settings || {}
  const base = (rS.settingsUpdatedAt || 0) > (lS.settingsUpdatedAt || 0)
    ? { ...lS, ...rS }
    : { ...rS, ...lS }
  const settings = {
    ...base,
    syncToken: lS.syncToken || '',
    gistId: lS.gistId || '',
    syncUser: lS.syncUser || '',
  }
  return {
    ...local,
    settings,
    shows: shows.map,
    movies: movies.map,
    deleted: { shows: shows.del, movies: movies.del },
    seededAt: Math.min(local.seededAt || Date.now(), remote.seededAt || Date.now()),
  }
}

// Canonical JSON pushed to the cloud (and used to detect real changes).
// Sync credentials stay on the device.
export function serializeForSync(state) {
  const { syncToken, gistId, syncUser, ...settings } = state.settings || {}
  return JSON.stringify({
    v: 1,
    settings,
    shows: state.shows || {},
    movies: state.movies || {},
    deleted: state.deleted || { shows: {}, movies: {} },
    seededAt: state.seededAt || 0,
  })
}
