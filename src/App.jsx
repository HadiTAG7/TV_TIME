import { useEffect, useState } from 'react'
import { AppProvider } from './store.jsx'
import { TopNav, BottomNav } from './components/Nav.jsx'
import Icon from './components/Icon.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import ShowDetail from './components/ShowDetail.jsx'
import MovieDetail from './components/MovieDetail.jsx'
import ShowsScreen from './screens/ShowsScreen.jsx'
import MoviesScreen from './screens/MoviesScreen.jsx'
import UpcomingScreen from './screens/UpcomingScreen.jsx'
import TrendingScreen from './screens/TrendingScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'

const TAB_IDS = ['upcoming', 'shows', 'movies', 'trending', 'profile']

function initialTab() {
  const hash = location.hash.replace('#/', '')
  return TAB_IDS.includes(hash) ? hash : 'shows'
}

function Shell() {
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState(null) // null | { query }
  const [detail, setDetail] = useState(null) // null | { kind: 'tv'|'movie', id }

  useEffect(() => {
    history.replaceState(null, '', `#/${tab}`)
  }, [tab])

  useEffect(() => {
    const onHash = () => {
      const hash = location.hash.replace('#/', '')
      if (TAB_IDS.includes(hash)) setTab(hash)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openSearch = (query = '') => setSearch({ query })

  return (
    <div className="pb-24 md:pb-8 min-h-dvh">
      <TopNav tab={tab} onTab={setTab} onSearch={() => openSearch()} />

      {tab === 'shows' && <ShowsScreen onOpenDetail={setDetail} onOpenSearch={() => openSearch()} />}
      {tab === 'movies' && <MoviesScreen onOpenDetail={setDetail} onSearchGenre={(g) => openSearch(g)} />}
      {tab === 'upcoming' && <UpcomingScreen onOpenDetail={setDetail} />}
      {tab === 'trending' && <TrendingScreen onOpenDetail={setDetail} />}
      {tab === 'profile' && <ProfileScreen />}

      <BottomNav tab={tab} onTab={setTab} />

      {/* Floating Action Button — add a title from anywhere */}
      {(tab === 'shows' || tab === 'movies') && (
        <button
          onClick={() => openSearch()}
          className="fixed bottom-20 end-6 md:bottom-10 md:end-10 w-14 h-14 bg-primary-container text-[#0d1117] rounded-xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
          aria-label="add"
        >
          <Icon name="add" className="text-2xl" />
        </button>
      )}

      <SearchOverlay
        open={!!search}
        initialQuery={search?.query || ''}
        onClose={() => setSearch(null)}
        onOpenDetail={setDetail}
      />

      {detail?.kind === 'tv' && <ShowDetail id={detail.id} onClose={() => setDetail(null)} />}
      {detail?.kind === 'movie' && <MovieDetail id={detail.id} onClose={() => setDetail(null)} />}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
