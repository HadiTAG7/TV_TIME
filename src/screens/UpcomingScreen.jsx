import { useEffect } from 'react'
import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { useApp } from '../store.jsx'
import { upcomingFor } from '../lib/progress.js'
import { fmtDate, fmtWeekday, daysFromToday } from '../lib/format.js'

function Row({ entry, onOpen }) {
  const { state, t } = useApp()
  const { show, ep, season } = entry
  const isPremiere = ep.n === 1
  return (
    <button
      className="glass rounded-xl p-3 flex items-center gap-md w-full text-start hover:bg-white/5 transition-colors fade-up"
      onClick={onOpen}
    >
      <div className="w-16 h-24 flex-none rounded-lg overflow-hidden">
        <Poster item={show} showTitle={false} iconSize="text-3xl" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label-md text-primary-container mb-0.5">
          {[fmtDate(ep.air, state.settings.lang), show.network, show.airTime].filter(Boolean).join(' • ')}
        </p>
        <h3 className="text-headline-md text-on-surface truncate" dir="auto">{show.name}</h3>
        <p className="text-body-md text-on-surface-variant truncate" dir="auto">
          <span dir="ltr">S{String(season).padStart(2, '0')} E{String(ep.n).padStart(2, '0')}</span>
          {' • '}
          {isPremiere ? t('seasonPremiere') : ep.name}
        </p>
      </div>
      <Icon name="chevron_right" className="text-on-surface-variant flex-none rtl:rotate-180" />
    </button>
  )
}

function FeatureCard({ entry, onOpen }) {
  const { state, t } = useApp()
  const { show, ep, season } = entry
  return (
    <button
      className="relative w-full aspect-[16/9] @2xl:aspect-[21/7] @2xl:col-span-2 rounded-xl overflow-hidden glass text-start group fade-up"
      onClick={onOpen}
    >
      <div className="absolute inset-0">
        {show.backdrop
          ? <img src={show.backdrop} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          : <Poster item={show} showTitle={false} iconSize="text-8xl" />}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 start-0 p-md w-full">
        <span className="inline-block bg-primary-container text-[#0d1117] text-label-md font-bold px-3 py-1 rounded-full mb-2">
          {fmtWeekday(ep.air, state.settings.lang)}
        </span>
        <h3 className="text-headline-lg-mobile md:text-headline-lg text-white drop-shadow" dir="auto">{show.name}</h3>
        <p className="text-body-md text-on-surface-variant" dir="auto">
          <span dir="ltr">S{String(season).padStart(2, '0')} E{String(ep.n).padStart(2, '0')}</span>
          {' • '}
          {ep.n === 1 ? t('seasonPremiere') : ep.name}
        </p>
      </div>
    </button>
  )
}

export default function UpcomingScreen({ onOpenDetail }) {
  const { state, actions, t } = useApp()

  // Refresh episode data for TMDB shows so new air dates appear (throttled in store).
  useEffect(() => {
    for (const id of Object.keys(state.shows)) actions.refreshShow(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const upcoming = upcomingFor(state.shows)
  const lang = state.settings.lang
  const groups = { today: [], tomorrow: [], week: [], later: [] }
  for (const u of upcoming) {
    const d = daysFromToday(u.ep.air)
    if (d <= 0) groups.today.push(u)
    else if (d === 1) groups.tomorrow.push(u)
    else if (d <= 7) groups.week.push(u)
    else groups.later.push(u)
  }

  const weekRange = groups.week.length
    ? `${fmtDate(groups.week[0].ep.air, lang)} - ${fmtDate(groups.week[groups.week.length - 1].ep.air, lang)}`
    : ''
  const laterRange = groups.later.length
    ? `${fmtDate(groups.later[0].ep.air, lang)} - ${fmtDate(groups.later[groups.later.length - 1].ep.air, lang)}`
    : ''

  const sections = [
    { key: 'today', title: t('today'), dot: true, side: fmtDate(new Date().toISOString().slice(0, 10), lang), items: groups.today },
    { key: 'tomorrow', title: t('tomorrow'), side: fmtDate(new Date(Date.now() + 864e5).toISOString().slice(0, 10), lang), items: groups.tomorrow },
    { key: 'week', title: t('thisWeek'), side: weekRange, items: groups.week, featured: true },
    { key: 'later', title: t('later'), side: laterRange, items: groups.later },
  ]

  return (
    <main className="@container mt-20 px-margin-mobile md:px-margin-desktop max-w-[1100px] mx-auto pb-12">
      <section className="py-lg">
        <h2 className="text-headline-lg md:text-headline-xl text-on-surface">{t('upcoming')}</h2>
        <p className="text-body-lg text-on-surface-variant">{t('upcomingSub')}</p>
      </section>

      {upcoming.length === 0 && (
        <div className="glass rounded-xl p-lg flex items-center gap-md">
          <Icon name="event_busy" className="text-outline text-4xl" />
          <p className="text-body-md text-on-surface-variant">{t('emptyUpcoming')}</p>
        </div>
      )}

      {sections.map((sec) =>
        sec.items.length === 0 ? null : (
          <section key={sec.key} className="mb-lg">
            <div className="flex items-baseline justify-between mb-md">
              <h3 className="text-headline-md text-on-surface flex items-center gap-2">
                {sec.title}
                {sec.dot && <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />}
              </h3>
              <span className="text-label-md text-on-surface-variant">{sec.side}</span>
            </div>
            {/* Two columns when the content area is wide enough (container query) */}
            <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-md">
              {sec.items.map((u, i) =>
                sec.featured && i === 0 ? (
                  <FeatureCard key={u.show.id} entry={u} onOpen={() => onOpenDetail({ kind: 'tv', id: u.show.id })} />
                ) : (
                  <Row key={u.show.id} entry={u} onOpen={() => onOpenDetail({ kind: 'tv', id: u.show.id })} />
                )
              )}
            </div>
          </section>
        )
      )}
    </main>
  )
}
