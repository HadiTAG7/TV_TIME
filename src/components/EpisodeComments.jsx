import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import { useApp } from '../store.jsx'
import { fetchEpisodeComments } from '../lib/comments.js'
import { fmtDate } from '../lib/format.js'

// Where a batch of comments came from, shown so the scope is never ambiguous.
const SOURCE_LABEL = { trakt: 'Trakt.tv', anilist: 'AniList', tmdb: 'TMDB' }

// One comment. Spoiler-flagged bodies are blurred until tapped.
function Comment({ c, lang, t }) {
  const [revealed, setRevealed] = useState(false)
  const hidden = c.spoiler && !revealed
  return (
    <li className="border-t border-white/5 py-3 first:border-t-0">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm flex items-center justify-center flex-none uppercase">
          {c.user.slice(0, 1)}
        </span>
        <span className="text-label-md text-on-surface truncate" dir="ltr">{c.user}</span>
        {c.rating > 0 && (
          <span className="text-label-sm text-primary-container flex-none flex items-center gap-0.5">
            <Icon name="star" filled style={{ fontSize: '12px' }} />{c.rating}
          </span>
        )}
        <span className="flex-1" />
        {c.createdAt && (
          <span className="text-label-sm text-on-surface-variant flex-none">
            {fmtDate(c.createdAt.slice(0, 10), lang)}
          </span>
        )}
      </div>

      <div className="relative">
        <p
          className={`text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line ${
            hidden ? 'blur-sm select-none' : ''
          }`}
          dir="auto"
        >
          {c.text}
        </p>
        {hidden && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 flex items-center justify-center bg-surface-container-low/40 rounded-lg"
          >
            <span className="text-label-md text-primary-container font-bold flex items-center gap-1">
              <Icon name="visibility" className="text-base" /> {t('tapToReveal')}
            </span>
          </button>
        )}
      </div>

      {(c.likes > 0 || c.replies > 0) && (
        <div className="flex items-center gap-3 mt-1.5 text-label-sm text-on-surface-variant">
          {c.likes > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="favorite" className="text-base" />{c.likes}
            </span>
          )}
          {c.replies > 0 && (
            <span className="flex items-center gap-1">
              <Icon name="reply" className="text-base" />{c.replies}
            </span>
          )}
        </div>
      )}
    </li>
  )
}

// Community comments for a single episode, from Trakt.tv.
// Portaled to <body>: the parent Sheet's transform (.sheet-in) and
// backdrop-filter (.glass) would otherwise trap this fixed overlay inside it.
export default function EpisodeComments({ show, season, ep, onClose }) {
  const { state, t } = useApp()
  const lang = state.settings.lang
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  // Comments about an episode you haven't watched are spoilers by nature,
  // so gate them behind an explicit confirmation.
  const watched = !!show.watched[`${season}:${ep.n}`]
  const [gateOpen, setGateOpen] = useState(!watched)

  useEffect(() => {
    let alive = true
    setBusy(true)
    const auth = { key: state.settings.tmdbKey.trim(), lang }
    fetchEpisodeComments(show, season, ep.n, auth)
      .then((res) => {
        if (!alive) return
        setData(res)
        setUnavailable(!!res.unavailable)
      })
      .catch(() => { if (alive) setData({ source: null, scope: 'episode', comments: [] }) })
      .finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.id, season, ep.n])

  const comments = data?.comments || []

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm overlay-in flex items-end md:items-center justify-center md:p-6"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-[36rem] max-h-[85dvh] rounded-t-xl md:rounded-xl sheet-in flex flex-col"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-md border-b border-white/10 flex-none">
          <div className="min-w-0 flex-1">
            <p className="text-label-md text-primary-container" dir="ltr">
              S{String(season).padStart(2, '0')}E{String(ep.n).padStart(2, '0')}
            </p>
            <h3 className="text-headline-md text-on-surface truncate" dir="auto">{ep.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all flex-none"
            aria-label="close"
          >
            <Icon name="close" className="text-white text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-md">
          {gateOpen ? (
            <div className="flex flex-col items-center text-center gap-md py-lg">
              <Icon name="visibility_off" className="text-outline text-4xl" />
              <p className="text-body-lg text-on-surface leading-relaxed">{t('spoilerWarning')}</p>
              <button
                onClick={() => setGateOpen(false)}
                className="px-lg py-3 rounded-lg bg-primary-container text-[#0d1117] text-label-md font-bold active:scale-95 transition-transform"
              >
                {t('showAnyway')}
              </button>
            </div>
          ) : busy ? (
            <p className="text-body-md text-on-surface-variant flex items-center gap-2 py-lg justify-center">
              <Icon name="progress_activity" className="animate-spin" /> {t('loadingComments')}
            </p>
          ) : unavailable ? (
            <p className="text-body-md text-on-surface-variant text-center py-lg">
              {t('commentsUnavailable')}
            </p>
          ) : comments.length === 0 ? (
            <p className="text-body-md text-on-surface-variant text-center py-lg">
              {t('emptyComments')}
            </p>
          ) : (
            <>
              {data.scope === 'show' && (
                <p className="text-label-sm text-on-surface-variant mb-2">{t('showLevelComments')}</p>
              )}
              {data.source === 'anilist' && (
                <p className="text-label-sm text-primary-container mb-2">{t('episodeDiscussion')}</p>
              )}
              <ul>
                {comments.map((c) => <Comment key={c.id} c={c} lang={lang} t={t} />)}
              </ul>
            </>
          )}
        </div>

        {/* Attribution — names whichever source actually supplied these */}
        {!gateOpen && data?.source && (
          <div className="px-md py-2 border-t border-white/10 flex-none">
            <span className="text-label-sm text-on-surface-variant">
              {t('commentsFrom', SOURCE_LABEL[data.source] || data.source)}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
