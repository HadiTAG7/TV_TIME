import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { useApp, showProgress } from '../store.jsx'

function ShowCard({ show, onOpen }) {
  const { actions, t } = useApp()
  const prog = showProgress(show)
  const canMarkNext = !!prog.nextEp

  return (
    <div
      className="poster-card relative group aspect-[2/3] rounded-xl overflow-hidden glass cursor-pointer fade-up"
      onClick={onOpen}
    >
      <div className="absolute inset-0 z-0">
        <Poster item={show} showTitle={false} className="group-hover:scale-110 transition-transform duration-700" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full p-md z-20">
        <h3 className="text-headline-md text-white mb-1 truncate" dir="auto">{show.name}</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-label-sm text-primary-container" dir="ltr">
            S{prog.currentSeason} • E{prog.seasonWatched}/{prog.seasonTotal}
          </span>
          <span className="text-label-sm text-on-surface-variant">{t('percentDone', prog.pct)}</span>
        </div>
        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${prog.pct}%` }} />
        </div>
      </div>
      {canMarkNext && (
        <button
          className="absolute top-2 end-2 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-primary-container text-[#0d1117] w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90"
          title={`+ S${prog.nextEp.season}E${prog.nextEp.ep.n}`}
          onClick={(e) => {
            e.stopPropagation()
            actions.markNext(show.id)
          }}
        >
          <Icon name="add" filled />
        </button>
      )}
    </div>
  )
}

export default function ShowsScreen({ onOpenDetail, onOpenSearch }) {
  const { state, t } = useApp()
  const [filter, setFilter] = useState('watching')
  const shows = Object.values(state.shows)
  const activeCount = shows.filter((s) => s.status === 'watching').length
  const filtered = shows
    .filter((s) => s.status === filter)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  const filters = [
    { id: 'watching', label: t('watching') },
    { id: 'plan', label: t('planToWatch') },
    { id: 'completed', label: t('completed') },
  ]

  return (
    <main className="mt-20 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
      <section className="py-lg flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg md:text-headline-xl text-on-surface">{t('yourLibrary')}</h2>
          <p className="text-body-lg text-on-surface-variant">{t('trackingActive', activeCount)}</p>
        </div>
        <div className="flex gap-sm overflow-x-auto pb-2 hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-md py-sm rounded-full text-label-md whitespace-nowrap transition-all duration-200 ${
                filter === f.id
                  ? 'bg-primary-container text-[#0d1117] font-bold'
                  : 'bg-surface-container-high text-on-surface hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-gutter py-md pb-12">
        {filtered.map((show) => (
          <ShowCard key={show.id} show={show} onOpen={() => onOpenDetail({ kind: 'tv', id: show.id })} />
        ))}
        <button
          onClick={onOpenSearch}
          className="aspect-[2/3] rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-md hover:bg-white/5 hover:border-primary-container transition-all duration-300"
        >
          <Icon name="add_box" className="text-outline text-4xl" />
          <span className="text-label-md text-outline">{t('addNewShow')}</span>
        </button>
      </div>

      {filtered.length === 0 && (
        <p className="text-body-md text-on-surface-variant pb-12 -mt-6">{t('emptyShows')}</p>
      )}
    </main>
  )
}
