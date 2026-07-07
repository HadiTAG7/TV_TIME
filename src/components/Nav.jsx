import Icon from './Icon.jsx'
import { useApp } from '../store.jsx'

const TABS = [
  { id: 'upcoming', icon: 'calendar_today', labelKey: 'navUpcoming' },
  { id: 'shows', icon: 'tv', labelKey: 'navShows' },
  { id: 'movies', icon: 'movie', labelKey: 'navMovies' },
  { id: 'profile', icon: 'person', labelKey: 'navProfile' },
]

export function TopNav({ tab, onTab, onSearch }) {
  const { t } = useApp()
  return (
    <header className="fixed top-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-margin-mobile h-16 md:px-margin-desktop">
      <button className="flex items-center gap-2 active:scale-95 transition-transform" onClick={() => onTab('shows')}>
        <Icon name="movie_filter" className="text-primary-container" />
        <h1 className="text-headline-lg-mobile font-bold text-primary">{t('appName')}</h1>
      </button>
      <div className="flex items-center gap-4">
        <nav className="hidden md:flex items-center gap-6">
          {TABS.map((x) => (
            <button
              key={x.id}
              onClick={() => onTab(x.id)}
              className={`text-label-md uppercase tracking-wider transition-colors ${
                tab === x.id ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {t(x.labelKey)}
            </button>
          ))}
        </nav>
        <button
          className="active:scale-95 transition-transform hover:opacity-80 p-2 rounded-full"
          onClick={onSearch}
          aria-label={t('search')}
        >
          <Icon name="search" className="text-on-surface" />
        </button>
      </div>
    </header>
  )
}

export function BottomNav({ tab, onTab }) {
  const { t } = useApp()
  return (
    <nav className="md:hidden bg-surface/80 backdrop-blur-xl border-t border-white/10 fixed bottom-0 left-0 w-full z-40 flex justify-around items-center pt-2 pb-safe px-4 h-16">
      {TABS.map((x) => {
        const active = tab === x.id
        return (
          <button
            key={x.id}
            onClick={() => onTab(x.id)}
            className={`flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all duration-200 ${
              active ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-primary/80'
            }`}
          >
            <Icon name={x.icon} filled={active} />
            <span className="text-label-sm">{t(x.labelKey)}</span>
          </button>
        )
      })}
    </nav>
  )
}
