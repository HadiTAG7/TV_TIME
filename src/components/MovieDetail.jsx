import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import RatingStars from './RatingStars.jsx'
import Sheet from './Sheet.jsx'
import { useApp } from '../store.jsx'

export default function MovieDetail({ id, onClose }) {
  const { state, actions, t } = useApp()
  const movie = state.movies[id]
  if (!movie) return null

  return (
    <Sheet open onClose={onClose}>
      <div className="relative aspect-video w-full overflow-hidden">
        {movie.backdrop
          ? <img src={movie.backdrop} alt="" className="w-full h-full object-cover" />
          : <Poster item={movie} showTitle={false} iconSize="text-7xl" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent" />
        <div className="absolute bottom-0 start-0 p-md w-full">
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-white drop-shadow" dir="auto">{movie.title}</h2>
          <p className="text-label-md text-on-surface-variant mt-1">
            {[
              movie.year,
              (movie.genres || []).slice(0, 3).join(' / '),
              movie.runtime ? `${movie.runtime} ${t('min')}` : '',
              movie.vote ? `★ ${movie.vote}` : '',
            ].filter(Boolean).join(' • ')}
          </p>
        </div>
      </div>

      <div className="p-md flex flex-col gap-lg pb-8">
        <div className="flex gap-sm flex-wrap">
          <button
            onClick={() => actions.setMovieStatus(movie.id, 'watchlist')}
            className={`px-md py-sm rounded-full text-label-md transition-all duration-200 flex items-center gap-1 ${
              movie.status === 'watchlist'
                ? 'bg-primary-container text-[#0d1117] font-bold'
                : 'bg-surface-container-high text-on-surface hover:bg-white/10'
            }`}
          >
            <Icon name="bookmark" className="text-base" /> {t('watchlist')}
          </button>
          <button
            onClick={() => actions.setMovieStatus(movie.id, 'watched')}
            className={`px-md py-sm rounded-full text-label-md transition-all duration-200 flex items-center gap-1 ${
              movie.status === 'watched'
                ? 'bg-primary-container text-[#0d1117] font-bold'
                : 'bg-surface-container-high text-on-surface hover:bg-white/10'
            }`}
          >
            <Icon name="check_circle" className="text-base" /> {t('watched')}
          </button>
          <a
            href={movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent((movie.title || '') + ' trailer')}`}
            target="_blank"
            rel="noreferrer"
            className="px-md py-sm rounded-full text-label-md bg-transparent border border-white/20 text-on-surface hover:bg-white/10 transition-all duration-200 flex items-center gap-1"
          >
            <Icon name="play_arrow" filled className="text-base" /> {t('watchTrailer')}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-body-md text-on-surface-variant">{t('yourRating')}</span>
          <RatingStars value={movie.rating} onChange={(r) => actions.rateMovie(movie.id, r)} />
        </div>

        {movie.overview && (
          <div>
            <h3 className="text-headline-md text-on-surface mb-1">{t('overview')}</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed" dir="auto">{movie.overview}</p>
          </div>
        )}

        <button
          className="self-start text-label-md text-error flex items-center gap-1 hover:underline"
          onClick={() => {
            if (confirm(t('removeConfirm'))) {
              actions.removeMovie(movie.id)
              onClose()
            }
          }}
        >
          <Icon name="delete" className="text-base" /> {t('removeFromLibrary')}
        </button>
      </div>
    </Sheet>
  )
}
