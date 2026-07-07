import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Poster from './Poster.jsx'
import { useApp } from '../store.jsx'

export default function SearchOverlay({ open, initialQuery = '', onClose, onOpenDetail }) {
  const { state, actions, t, hasKey } = useApp()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const inputRef = useRef(null)
  const seq = useRef(0)

  useEffect(() => {
    if (open) {
      setQuery(initialQuery)
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, initialQuery])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) { setResults([]); return }
    const mySeq = ++seq.current
    setBusy(true)
    const timer = setTimeout(async () => {
      try {
        const res = await actions.search(q)
        if (seq.current === mySeq) setResults(res)
      } catch {
        if (seq.current === mySeq) setResults([])
      } finally {
        if (seq.current === mySeq) setBusy(false)
      }
    }, hasKey ? 350 : 80)
    return () => clearTimeout(timer)
  }, [query, open, actions, hasKey])

  if (!open) return null

  async function add(item) {
    setAddingId(item.id)
    try {
      if (item.type === 'tv') {
        const id = await actions.addShow(item, 'watching')
        onOpenDetail?.({ kind: 'tv', id })
      } else {
        const id = await actions.addMovie(item, 'watchlist')
        onOpenDetail?.({ kind: 'movie', id })
      }
      onClose()
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overlay-in" onClick={onClose}>
      <div
        className="glass max-w-2xl mx-auto mt-4 md:mt-20 rounded-xl overflow-hidden flex flex-col max-h-[85dvh] sheet-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-md border-b border-white/10">
          <Icon name="search" className="text-on-surface-variant" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            dir="auto"
            className="flex-1 bg-transparent outline-none text-body-lg text-on-surface placeholder:text-white/30"
          />
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label={t('close')}>
            <Icon name="close" className="text-on-surface-variant" />
          </button>
        </div>

        {!hasKey && (
          <p className="px-md py-2 text-label-sm text-on-surface-variant bg-primary-container/10 border-b border-white/5">
            {t('searchDemoNote')}
          </p>
        )}

        <div className="overflow-y-auto flex-1 p-sm">
          {busy && <p className="p-md text-body-md text-on-surface-variant animate-pulse">…</p>}
          {!busy && query.trim() && results.length === 0 && (
            <p className="p-md text-body-md text-on-surface-variant">{t('noResults')}</p>
          )}
          <ul className="flex flex-col gap-1">
            {results.map((item) => {
              const inLib = !!(state.shows[item.id] || state.movies[item.id])
              return (
                <li key={item.id}>
                  <div
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      if (inLib) {
                        onOpenDetail?.({ kind: item.type, id: item.id })
                        onClose()
                      } else {
                        add(item)
                      }
                    }}
                  >
                    <div className="w-12 h-[72px] flex-none rounded overflow-hidden">
                      <Poster item={item} showTitle={false} iconSize="text-2xl" />
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <p className="text-body-lg font-semibold text-on-surface truncate" dir="auto">
                        {item.name || item.title}
                      </p>
                      <p className="text-label-md text-on-surface-variant">
                        {item.type === 'tv' ? t('tvBadge') : t('movieBadge')}
                        {item.year ? ` • ${item.year}` : ''}
                        {item.vote ? ` • ★ ${item.vote}` : ''}
                      </p>
                    </div>
                    {inLib ? (
                      <span className="text-label-md text-primary-container flex items-center gap-1 flex-none">
                        <Icon name="check_circle" filled className="text-base" /> {t('inLibrary')}
                      </span>
                    ) : (
                      <span className="flex-none px-3 py-1.5 rounded-full bg-primary-container text-[#0d1117] text-label-md font-bold flex items-center gap-1">
                        {addingId === item.id
                          ? <Icon name="progress_activity" className="text-base animate-spin" />
                          : <Icon name="add" className="text-base" />}
                        {t('add')}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
