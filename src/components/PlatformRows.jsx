import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import { useApp } from '../store.jsx'
import { discoverTvByProvider } from '../lib/tmdb.js'

// TMDB watch-provider IDs verified non-empty for the SA region.
// Rows that come back empty (or error) are hidden automatically.
const PLATFORMS = [
  { id: 8, name: 'Netflix' },
  { id: 119, name: 'Prime Video' },
  { id: 350, name: 'Apple TV+' },
  { id: 629, name: 'OSN+' },
  { id: 1715, name: 'Shahid VIP' },
  { id: 630, name: 'STARZPLAY' },
]
const CACHE_KEY = 'cinetrack.discover.v1'
const CACHE_TTL = 6 * 60 * 60 * 1000

export default function PlatformRows({ onOpenDetail }) {
  const { state, actions, t, hasKey } = useApp()
  const [rows, setRows] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!hasKey) return
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.at < CACHE_TTL) {
        setRows(cached.rows)
        return
      }
    } catch { /* bad cache — refetch */ }
    let alive = true
    const auth = { key: state.settings.tmdbKey.trim(), lang: state.settings.lang }
    Promise.all(
      PLATFORMS.map((p) => discoverTvByProvider(p.id, auth).catch(() => []))
    ).then((lists) => {
      if (!alive) return
      const fetched = {}
      PLATFORMS.forEach((p, i) => { fetched[p.id] = lists[i] })
      setRows(fetched)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: fetched }))
      } catch { /* storage full — rows still shown from memory */ }
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey])

  if (!hasKey || !rows) return null
  if (!PLATFORMS.some((p) => rows[p.id]?.length)) return null

  async function open(item) {
    if (state.shows[item.id]) {
      onOpenDetail({ kind: 'tv', id: item.id })
      return
    }
    setBusyId(item.id)
    try {
      const id = await actions.addShow(item, 'watching')
      onOpenDetail({ kind: 'tv', id })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="mt-xl pb-8" data-testid="platform-rows">
      <h3 className="text-headline-md text-on-surface mb-md">{t('exploreByPlatform')}</h3>
      <div className="flex flex-col gap-lg">
        {PLATFORMS.map((p) =>
          !rows[p.id]?.length ? null : (
            <div key={p.id} data-platform={p.name}>
              <h4 className="text-body-lg font-semibold text-on-surface-variant mb-sm">
                {t('popularOn', p.name)}
              </h4>
              <div className="flex gap-gutter overflow-x-auto hide-scrollbar pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
                {rows[p.id].map((item) => {
                  const inLib = !!state.shows[item.id]
                  return (
                    <button
                      key={item.id}
                      className="w-32 md:w-40 flex-none text-start group"
                      onClick={() => open(item)}
                    >
                      <div className="poster-card relative aspect-[2/3] rounded-xl overflow-hidden glass mb-2">
                        <Poster item={item} showTitle={false} className="group-hover:scale-110 transition-transform duration-700" />
                        {item.vote > 0 && (
                          <span className="absolute top-2 end-2 glass rounded-full px-2 py-0.5 text-label-sm text-white flex items-center gap-1">
                            <Icon name="star" filled className="text-primary-container" style={{ fontSize: '12px' }} />
                            {item.vote}
                          </span>
                        )}
                        {inLib && (
                          <span className="absolute bottom-2 start-2 bg-primary-container text-[#0d1117] rounded-full px-2 py-0.5 text-label-sm font-bold">
                            ✓
                          </span>
                        )}
                        {busyId === item.id && (
                          <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Icon name="progress_activity" className="animate-spin text-primary-container" />
                          </span>
                        )}
                      </div>
                      <p className="text-body-md font-semibold text-on-surface truncate" dir="auto">{item.name}</p>
                      <p className="text-label-md text-on-surface-variant truncate">
                        {[item.year, item.vote ? `★ ${item.vote}` : ''].filter(Boolean).join(' • ')}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  )
}
