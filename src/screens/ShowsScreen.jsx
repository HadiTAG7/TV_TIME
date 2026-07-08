import Icon from '../components/Icon.jsx'
import Poster from '../components/Poster.jsx'
import { useApp, showProgress } from '../store.jsx'

// Library buckets, in display order:
// watching   — started, and aired episodes remain to watch
// notStarted — planned or added with zero episodes watched
// upToDate   — caught up with everything aired, waiting for new episodes
// completed  — finished (manual status)
// dropped    — stopped watching (manual status)
export const BUCKET_ORDER = ['watching', 'notStarted', 'upToDate', 'completed', 'dropped']

export function bucketOf(show) {
  if (show.status === 'completed') return 'completed'
  if (show.status === 'dropped') return 'dropped'
  const { watchedEps, nextEp } = showProgress(show)
  if (show.status === 'plan' || watchedEps === 0) return 'notStarted'
  return nextEp ? 'watching' : 'upToDate'
}

const BUCKET_LABEL_KEYS = {
  watching: 'watching',
  notStarted: 'planToWatch',
  upToDate: 'upToDate',
  completed: 'completed',
  dropped: 'dropped',
}

// Progress-bar color per status: yellow = still airing/watchable,
// green = caught up & waiting for new episodes, purple = finished,
// gray = dropped.
export const BUCKET_BAR_COLOR = {
  watching: '#ffd700',
  upToDate: '#34d399',
  completed: '#b58cff',
  dropped: '#8a8a8a',
}

// TV Time-style compact card: clean poster, thin progress bar at the bottom,
// details on tap. Hover reveals a quick "mark next episode" action.
function ShowCard({ show, onOpen }) {
  const { actions } = useApp()
  const prog = showProgress(show)
  const started = prog.watchedEps > 0
  const barColor = BUCKET_BAR_COLOR[bucketOf(show)] || '#ffd700'

  return (
    <div
      className="poster-card relative group aspect-[2/3] rounded-lg overflow-hidden bg-surface-container cursor-pointer fade-up"
      title={show.name}
      onClick={onOpen}
    >
      <Poster item={show} showTitle iconSize="text-3xl" className="group-hover:scale-105 transition-transform duration-500" />
      {started && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/60 z-10">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${prog.pct}%`, backgroundColor: barColor }}
          />
        </div>
      )}
      {prog.nextEp && (
        <button
          className="absolute top-1.5 end-1.5 z-20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-primary-container text-[#0d1117] w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90"
          title={`+ S${prog.nextEp.season}E${prog.nextEp.ep.n}`}
          onClick={(e) => {
            e.stopPropagation()
            actions.markNext(show.id)
          }}
        >
          <Icon name="add" filled className="text-lg" />
        </button>
      )}
    </div>
  )
}

export default function ShowsScreen({ onOpenDetail, onOpenSearch }) {
  const { state, t } = useApp()
  const shows = Object.values(state.shows)
  const activeCount = shows.filter((s) => s.status === 'watching').length

  const buckets = Object.fromEntries(BUCKET_ORDER.map((b) => [b, []]))
  for (const show of shows) buckets[bucketOf(show)].push(show)
  for (const b of BUCKET_ORDER) buckets[b].sort((a, z) => (z.updatedAt || 0) - (a.updatedAt || 0))

  return (
    <main className="mt-20 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto pb-16">
      <section className="py-md text-center">
        <h2 className="text-headline-lg md:text-headline-xl text-on-surface">{t('yourLibrary')}</h2>
        <p className="text-body-md text-on-surface-variant">{t('trackingActive', activeCount)}</p>
      </section>

      {shows.length === 0 && (
        <p className="text-body-md text-on-surface-variant text-center py-lg">{t('emptyShows')}</p>
      )}

      {BUCKET_ORDER.map((bucket) =>
        buckets[bucket].length === 0 ? null : (
          <section key={bucket} data-bucket={bucket} className="mb-lg">
            <div className="flex justify-center mb-md mt-sm">
              <span className="bg-surface-container-highest text-on-surface text-label-md font-bold px-5 py-2 rounded-full">
                {t(BUCKET_LABEL_KEYS[bucket])}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              {buckets[bucket].map((show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  onOpen={() => onOpenDetail({ kind: 'tv', id: show.id })}
                />
              ))}
            </div>
          </section>
        )
      )}

      <div className="flex justify-center mt-lg">
        <button
          onClick={onOpenSearch}
          className="w-40 aspect-[2/3] rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-md hover:bg-white/5 hover:border-primary-container transition-all duration-300"
        >
          <Icon name="add_box" className="text-outline text-4xl" />
          <span className="text-label-md text-outline">{t('addNewShow')}</span>
        </button>
      </div>
    </main>
  )
}
