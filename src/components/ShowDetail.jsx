import { useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import RatingStars from './RatingStars.jsx'
import Sheet from './Sheet.jsx'
import { useApp, showProgress } from '../store.jsx'
import { fmtDate } from '../lib/format.js'

function StatusChips({ show }) {
  const { actions, t } = useApp()
  const options = [
    { id: 'watching', label: t('watching') },
    { id: 'plan', label: t('planToWatch') },
    { id: 'completed', label: t('completed') },
    { id: 'dropped', label: t('dropped') },
  ]
  return (
    <div className="flex gap-sm flex-wrap">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => actions.setShowStatus(show.id, o.id)}
          className={`px-md py-sm rounded-full text-label-md transition-all duration-200 ${
            show.status === o.id
              ? 'bg-primary-container text-[#0d1117] font-bold'
              : 'bg-surface-container-high text-on-surface hover:bg-white/10'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Unwatched episodes anywhere in the show before (s, e).
function countPrevUnwatched(show, s, e) {
  let count = 0
  for (const season of show.seasons) {
    if (season.n > s) continue
    for (const ep of season.episodes) {
      if (season.n === s && ep.n >= e) continue
      if (!show.watched[`${season.n}:${ep.n}`]) count++
    }
  }
  return count
}

function SeasonBlock({ show, season, onCheckEpisode }) {
  const { state, actions, t } = useApp()
  const lang = state.settings.lang
  const [open, setOpen] = useState(false)
  const watched = season.episodes.filter((e) => show.watched[`${season.n}:${e.n}`]).length
  const total = season.episodes.length
  const allDone = watched === total && total > 0
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-lg bg-surface-container-low border border-white/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-3 p-md hover:bg-white/5 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon name={open ? 'expand_less' : 'expand_more'} className="text-on-surface-variant flex-none" />
          <span className="text-body-lg font-semibold text-on-surface">
            {season.n === 0 ? t('specials') : t('season', season.n)}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-none">
          <span className="text-label-md text-on-surface-variant">{t('episodesCount', watched, total)}</span>
          <div className="h-1 w-16 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-500"
              style={{ width: `${total ? (watched / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5">
          <div className="px-md py-2 flex justify-end">
            <button
              className="text-label-md text-primary-container hover:underline"
              onClick={() => actions.markSeason(show.id, season.n, !allDone)}
            >
              {allDone ? t('unmarkAllSeason') : t('markAllSeason')}
            </button>
          </div>
          <ul>
            {season.episodes.map((ep) => {
              const done = !!show.watched[`${season.n}:${ep.n}`]
              const future = ep.air && ep.air > today
              return (
                <li
                  key={ep.n}
                  className={`flex items-center gap-3 px-md py-2.5 border-t border-white/5 ${future ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="ep-check"
                    checked={done}
                    onChange={() => {
                      // Unchecking is always direct; checking may ask about
                      // earlier unwatched episodes first.
                      if (done) actions.toggleEpisode(show.id, season.n, ep.n)
                      else onCheckEpisode(season.n, ep.n)
                    }}
                    aria-label={`S${season.n}E${ep.n}`}
                  />
                  <span className="text-label-md text-on-surface-variant w-8 flex-none" dir="ltr">
                    E{ep.n}
                  </span>
                  <span className="flex-1 text-body-md text-on-surface truncate" dir="auto">{ep.name}</span>
                  {ep.air && (
                    <span className="text-label-sm text-on-surface-variant flex-none">{fmtDate(ep.air, lang)}</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function ShowDetail({ id, onClose }) {
  const { state, actions, t } = useApp()
  const [pendingEp, setPendingEp] = useState(null) // { s, e, count }
  const show = state.shows[id]
  if (!show) return null
  const prog = showProgress(show)

  function onCheckEpisode(s, e) {
    const count = countPrevUnwatched(show, s, e)
    if (count > 0) setPendingEp({ s, e, count })
    else actions.toggleEpisode(show.id, s, e)
  }

  return (
    <Sheet open onClose={onClose}>
      {/* Header artwork */}
      <div className="relative aspect-video w-full overflow-hidden">
        {show.backdrop
          ? <img src={show.backdrop} alt="" className="w-full h-full object-cover" />
          : <Poster item={show} showTitle={false} iconSize="text-7xl" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent" />
        <div className="absolute bottom-0 start-0 p-md w-full">
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-white drop-shadow" dir="auto">{show.name}</h2>
          <p className="text-label-md text-on-surface-variant mt-1">
            {[show.year, show.network, (show.genres || []).slice(0, 3).join(' / ')].filter(Boolean).join(' • ')}
          </p>
        </div>
      </div>

      <div className="p-md flex flex-col gap-lg pb-8">
        {/* Overall progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-label-md text-primary-container" dir="ltr">
              S{prog.currentSeason} • E{prog.seasonWatched}/{prog.seasonTotal}
            </span>
            <span className="text-label-md text-on-surface-variant">{t('percentDone', prog.pct)}</span>
          </div>
          <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${prog.pct}%` }} />
          </div>
          {prog.nextAiring && (
            <p className="text-body-md text-on-surface-variant mt-2">
              <Icon name="event" className="text-sm align-middle me-1" />
              {t('nextEpisode')}: <span dir="ltr">S{prog.nextAiring.season}E{prog.nextAiring.ep.n}</span>
              {' • '}{fmtDate(prog.nextAiring.ep.air, state.settings.lang)}
            </p>
          )}
        </div>

        <StatusChips show={show} />

        <div className="flex items-center justify-between">
          <span className="text-body-md text-on-surface-variant">{t('yourRating')}</span>
          <RatingStars value={show.rating} onChange={(r) => actions.rateShow(show.id, r)} />
        </div>

        {show.overview && (
          <div>
            <h3 className="text-headline-md text-on-surface mb-1">{t('overview')}</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed" dir="auto">{show.overview}</p>
          </div>
        )}

        <div>
          <h3 className="text-headline-md text-on-surface mb-2">{t('seasons')}</h3>
          <div className="flex flex-col gap-2">
            {show.seasons.map((s) => (
              <SeasonBlock key={s.n} show={show} season={s} onCheckEpisode={onCheckEpisode} />
            ))}
          </div>
        </div>

        <button
          className="self-start text-label-md text-error flex items-center gap-1 hover:underline"
          onClick={() => {
            if (confirm(t('removeConfirm'))) {
              actions.removeShow(show.id)
              onClose()
            }
          }}
        >
          <Icon name="delete" className="text-base" /> {t('removeFromLibrary')}
        </button>
      </div>

      {/* "Mark previous episodes too?" dialog — portaled to <body> because
          the sheet's transform would trap position:fixed inside it */}
      {pendingEp && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm overlay-in flex items-center justify-center p-6"
          onClick={() => setPendingEp(null)}
        >
          <div
            className="glass rounded-xl p-lg max-w-[24rem] w-full sheet-in flex flex-col gap-md"
            role="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Icon name="check_circle" className="text-primary-container" />
              <span className="text-label-md text-on-surface-variant" dir="ltr">
                S{pendingEp.s} • E{pendingEp.e}
              </span>
            </div>
            <p className="text-body-lg text-on-surface leading-relaxed">
              {t('markPrevQ', pendingEp.count)}
            </p>
            <div className="flex flex-col gap-sm">
              <button
                className="w-full py-3 rounded-lg bg-primary-container text-[#0d1117] text-label-md font-bold active:scale-95 transition-transform"
                onClick={() => {
                  actions.markThrough(show.id, pendingEp.s, pendingEp.e)
                  setPendingEp(null)
                }}
              >
                {t('yesMarkPrev')}
              </button>
              <button
                className="w-full py-3 rounded-lg bg-surface-container-high text-on-surface text-label-md font-bold hover:bg-white/10 active:scale-95 transition-all"
                onClick={() => {
                  actions.toggleEpisode(show.id, pendingEp.s, pendingEp.e)
                  setPendingEp(null)
                }}
              >
                {t('noJustThis')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Sheet>
  )
}
