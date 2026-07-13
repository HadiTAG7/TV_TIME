import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { useApp } from '../store.jsx'
import { showProgress } from '../lib/progress.js'
import { DEMO_GENRES } from '../lib/demo.js'

function Hero({ movie, onOpenDetail }) {
  const { state, actions, t } = useApp()
  const [busy, setBusy] = useState(false)
  if (!movie) return null
  const inLib = !!state.movies[movie.id]

  async function track() {
    if (inLib) {
      onOpenDetail({ kind: 'movie', id: movie.id })
      return
    }
    setBusy(true)
    try {
      const id = await actions.addMovie(movie, 'watchlist')
      onOpenDetail({ kind: 'movie', id })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="relative w-full aspect-[16/12] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-b-xl md:rounded-xl md:mt-4">
      <div className="absolute inset-0">
        {movie.backdrop
          ? <img src={movie.backdrop} alt="" className="w-full h-full object-cover" />
          : <Poster item={movie} showTitle={false} iconSize="text-8xl" />}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-transparent" />
      <div className="absolute bottom-0 start-0 w-full p-md md:p-lg max-w-2xl">
        <h2 className="text-headline-lg md:text-headline-xl text-white leading-tight mb-2 drop-shadow" dir="auto">
          {movie.title}
        </h2>
        {movie.overview && (
          <p className="text-body-md md:text-body-lg text-on-surface-variant line-clamp-2 mb-4" dir="auto">
            {movie.overview}
          </p>
        )}
        <div className="flex gap-sm">
          <a
            href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`}
            target="_blank"
            rel="noreferrer"
            className="bg-primary-container text-[#0d1117] font-bold px-md py-3 rounded-lg flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon name="play_arrow" filled /> {t('watchTrailer')}
          </a>
          <button
            onClick={track}
            className="glass text-on-surface font-bold px-md py-3 rounded-lg flex items-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
          >
            {busy
              ? <Icon name="progress_activity" className="animate-spin" />
              : <Icon name={inLib ? 'check' : 'add'} />}
            {inLib ? t('tracked') : t('trackMovie')}
          </button>
        </div>
      </div>
    </section>
  )
}

function ContinueTracking({ onOpenDetail }) {
  const { state, t } = useApp()
  const candidate = Object.values(state.shows)
    .filter((s) => s.status === 'watching')
    .map((s) => ({ show: s, prog: showProgress(s) }))
    .filter((x) => x.prog.nextEp)
    .sort((a, b) => (b.show.updatedAt || 0) - (a.show.updatedAt || 0))[0]
  if (!candidate) return null
  const { show, prog } = candidate
  const runtime = prog.nextEp.ep.runtime || show.episodeRunTime || 40

  return (
    <button
      className="glass rounded-xl p-md w-full text-start hover:bg-white/5 transition-colors"
      onClick={() => onOpenDetail({ kind: 'tv', id: show.id })}
    >
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-headline-md text-on-surface">{t('continueTracking')}</h4>
        <Icon name="auto_awesome" className="text-primary-container" />
      </div>
      <p className="text-body-md text-on-surface-variant mb-3" dir="auto">
        {show.name} <span dir="ltr">(S{prog.nextEp.season} E{prog.nextEp.ep.n})</span>
      </p>
      <div className="flex items-center justify-between text-label-sm text-on-surface-variant mb-1.5">
        <span>{t('minLeft', runtime)}</span>
        <span>{prog.pct}%</span>
      </div>
      <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
        <div className="h-full bg-primary-container" style={{ width: `${prog.pct}%` }} />
      </div>
    </button>
  )
}

export default function MoviesScreen({ onOpenDetail, onSearchGenre }) {
  const { state, actions, t, hasKey } = useApp()
  const [trending, setTrending] = useState([])

  useEffect(() => {
    let alive = true
    actions.trending().then((list) => { if (alive) setTrending(list) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey, state.settings.lang])

  const hero = trending.find((m) => m.hero) || trending[0]
  const watchlist = Object.values(state.movies)
    .filter((m) => m.status === 'watchlist')
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))

  return (
    <main className="mt-16 md:px-margin-desktop max-w-[1440px] mx-auto">
      <Hero movie={hero} onOpenDetail={onOpenDetail} />

      <div className="px-margin-mobile md:px-0 flex flex-col gap-lg py-lg pb-12">
        {/* Trending Now */}
        <section>
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-headline-md text-on-surface">{t('trendingNow')}</h3>
            <button className="text-label-md text-primary-container hover:underline" onClick={() => onSearchGenre('')}>
              {t('viewAll')}
            </button>
          </div>
          <div className="flex gap-gutter overflow-x-auto hide-scrollbar pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
            {trending.map((m) => {
              const inLib = !!state.movies[m.id]
              return (
                <button
                  key={m.id}
                  className="w-36 md:w-44 flex-none text-start group"
                  onClick={async () => {
                    const id = inLib ? m.id : await actions.addMovie(m, 'watchlist')
                    onOpenDetail({ kind: 'movie', id })
                  }}
                >
                  <div className="poster-card relative aspect-[2/3] rounded-xl overflow-hidden glass mb-2">
                    <Poster item={m} showTitle={false} className="group-hover:scale-110 transition-transform duration-700" />
                    {m.vote > 0 && (
                      <span className="absolute top-2 end-2 glass rounded-full px-2 py-0.5 text-label-sm text-white flex items-center gap-1">
                        <Icon name="star" filled className="text-primary-container" style={{ fontSize: '12px' }} />
                        {m.vote}
                      </span>
                    )}
                    {inLib && (
                      <span className="absolute bottom-2 start-2 bg-primary-container text-[#0d1117] rounded-full px-2 py-0.5 text-label-sm font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <p className="text-body-md font-semibold text-on-surface truncate" dir="auto">{m.title}</p>
                  <p className="text-label-md text-on-surface-variant truncate">
                    {[(m.genres || [])[0], m.year].filter(Boolean).join(' • ')}
                  </p>
                </button>
              )
            })}
          </div>
        </section>

        {/* My Watchlist */}
        <section>
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-headline-md text-on-surface">{t('myWatchlist')}</h3>
            <span className="text-label-md text-on-surface-variant">{watchlist.length}</span>
          </div>
          <div className="flex flex-col gap-md">
            <ContinueTracking onOpenDetail={onOpenDetail} />
            {watchlist.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">{t('emptyWatchlist')}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-gutter">
                {watchlist.map((m) => (
                  <button
                    key={m.id}
                    className="poster-card relative aspect-[2/3] rounded-xl overflow-hidden glass group text-start"
                    onClick={() => onOpenDetail({ kind: 'movie', id: m.id })}
                  >
                    <Poster item={m} showTitle={false} className="group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <p className="absolute bottom-3 start-3 end-3 text-headline-md text-white truncate" dir="auto">
                      {m.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Explore by Genre */}
        <section className="pb-8">
          <h3 className="text-headline-md text-on-surface mb-md">{t('exploreByGenre')}</h3>
          <div className="flex flex-wrap gap-sm">
            {DEMO_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => onSearchGenre(g)}
                className="px-md py-sm rounded-full bg-surface-container-high text-on-surface text-label-md hover:bg-white/10 transition-colors"
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
