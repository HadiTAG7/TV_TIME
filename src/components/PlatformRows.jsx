import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import { useApp } from '../store.jsx'
import { buildPlatformRows, netflixTop10 } from '../lib/platforms.js'

// Bumped whenever the payload shape changes, otherwise a stale cache keeps
// serving the previous structure for hours after a change ships.
const CACHE_KEY = 'cinetrack.discover.v4'
const CACHE_TTL = 6 * 60 * 60 * 1000

function Card({ item, rank, inLib, busy, onOpen }) {
  // Chart entries with no TMDB match can't be tracked, so they render as a
  // plain (non-interactive) card rather than a button that would fail.
  const Tag = item.unmatched ? 'div' : 'button'
  return (
    <Tag
      className={`w-32 md:w-40 flex-none text-start group ${item.unmatched ? 'opacity-70' : ''}`}
      onClick={item.unmatched ? undefined : onOpen}
    >
      <div className="poster-card relative aspect-[2/3] rounded-xl overflow-hidden glass mb-2">
        <Poster item={item} showTitle={item.unmatched} className="group-hover:scale-110 transition-transform duration-700" />
        {rank ? (
          <span className="absolute top-0 start-0 bg-primary-container text-[#0d1117] text-label-md font-bold px-2 py-0.5 rounded-be-lg" dir="ltr">
            #{rank}
          </span>
        ) : null}
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
        {busy && (
          <span className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Icon name="progress_activity" className="animate-spin text-primary-container" />
          </span>
        )}
      </div>
      <p className="text-body-md font-semibold text-on-surface truncate" dir="auto">{item.name}</p>
      <p className="text-label-md text-on-surface-variant truncate">
        {[item.year, item.vote ? `★ ${item.vote}` : ''].filter(Boolean).join(' • ')}
      </p>
    </Tag>
  )
}

function Row({ title, subtitle, items, state, busyId, onOpen }) {
  return (
    <div data-platform={title}>
      <div className="mb-sm">
        <h4 className="text-headline-md text-on-surface">{title}</h4>
        {subtitle && <p className="text-label-sm text-primary-container">{subtitle}</p>}
      </div>
      <div className="flex gap-gutter overflow-x-auto hide-scrollbar pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
        {items.map((item) => (
          <Card
            key={`${item.id}-${item.rank || ''}`}
            item={item}
            rank={item.rank}
            inLib={!!state.shows[item.id]}
            busy={busyId === item.id}
            onOpen={() => onOpen(item)}
          />
        ))}
      </div>
    </div>
  )
}

export default function PlatformRows({ onOpenDetail }) {
  const { state, actions, t, hasKey } = useApp()
  const [data, setData] = useState(null) // { netflix: [], rows: [] }
  const [busy, setBusy] = useState(true)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    if (!hasKey) { setBusy(false); return }
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.at < CACHE_TTL) {
        setData(cached.data)
        setBusy(false)
        return
      }
    } catch { /* bad cache — refetch */ }

    let alive = true
    setBusy(true)
    const auth = { key: state.settings.tmdbKey.trim(), lang: state.settings.lang }
    Promise.all([
      netflixTop10(auth).catch(() => []),
      buildPlatformRows(auth).catch(() => ({ global: [], local: [], elsewhere: [] })),
    ]).then(([netflix, groups]) => {
      if (!alive) return
      const next = { netflix, ...groups }
      setData(next)
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: next }))
      } catch { /* storage full — rows still shown from memory */ }
    }).finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey])

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

  if (busy) {
    return (
      <p className="text-body-md text-on-surface-variant flex items-center justify-center gap-2 py-lg">
        <Icon name="progress_activity" className="animate-spin" /> {t('loadingTrending')}
      </p>
    )
  }

  const netflix = data?.netflix || []
  const global = data?.global || []
  const local = data?.local || []
  const elsewhere = data?.elsewhere || []
  if (!netflix.length && !global.length && !local.length) {
    return <p className="text-body-md text-on-surface-variant text-center py-lg">{t('emptyTrending')}</p>
  }

  return (
    <section className="pb-8" data-testid="platform-rows">
      <div className="flex flex-col gap-lg">
        {global.length > 0 && (
          <Row
            title={t('globalTrending')}
            subtitle={t('globalTrendingSub')}
            items={global}
            state={state}
            busyId={busyId}
            onOpen={open}
          />
        )}
        {netflix.length > 0 && (
          <Row
            title={t('popularOn', 'Netflix')}
            subtitle={t('officialTop10')}
            items={netflix}
            state={state}
            busyId={busyId}
            onOpen={open}
          />
        )}
        {local.map((r) => (
          <Row
            key={r.id}
            title={t('popularOn', r.name)}
            items={r.items}
            state={state}
            busyId={busyId}
            onOpen={open}
          />
        ))}

        {/* Platforms with no Saudi presence — shown for browsing, but labelled
            so a title is never mistaken for something you can stream here. */}
        {elsewhere.length > 0 && (
          <>
            <h3 className="text-headline-md text-on-surface-variant mt-sm">{t('notAvailableHere')}</h3>
            {elsewhere.map((r) => (
              <Row
                key={`x-${r.id}`}
                title={t('popularOn', r.name)}
                subtitle={t('notAvailableHereSub')}
                items={r.items}
                state={state}
                busyId={busyId}
                onOpen={open}
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}
