import { useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'
import { useApp, computeStats, computeAchievements, watchHistory, topGenres } from '../store.jsx'
import { fmtTotalTime } from '../lib/format.js'
import { TMDB_PROXY } from '../lib/tmdb.js'
import { firebaseEnabled } from '../lib/firebase.js'
import { LANGS } from '../i18n.js'

function StatCard({ value, label }) {
  return (
    <div className="glass rounded-xl p-md flex flex-col items-center justify-center gap-1 py-6">
      <span className="text-headline-lg-mobile md:text-headline-lg text-primary-container font-bold" dir="ltr">{value}</span>
      <span className="text-label-md text-on-surface-variant uppercase tracking-widest">{label}</span>
    </div>
  )
}

function Achievement({ a, t }) {
  return (
    <div className="flex flex-col items-center gap-2 w-20 flex-none" title={t(a.descKey)}>
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center border ${
          a.unlocked
            ? 'bg-primary-container/90 border-primary-container text-[#0d1117]'
            : 'bg-surface-container-high border-white/10 text-on-surface-variant opacity-60'
        }`}
      >
        <Icon name={a.icon} filled={a.unlocked} className="text-3xl" />
      </div>
      <span className="text-label-sm text-on-surface text-center leading-tight">{t(a.nameKey)}</span>
    </div>
  )
}

function QuickRow({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`glass rounded-xl px-md py-4 flex items-center gap-3 w-full text-start hover:bg-white/5 transition-colors ${
        danger ? 'text-error' : 'text-on-surface'
      }`}
    >
      <Icon name={icon} className={danger ? 'text-error' : 'text-on-surface-variant'} />
      <span className="flex-1 text-body-lg">{label}</span>
      {!danger && <Icon name="chevron_right" className="text-on-surface-variant rtl:rotate-180" />}
    </button>
  )
}

function CloudSyncSection() {
  const { state, actions, t, syncInfo, fbUser } = useApp()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [emailBusy, setEmailBusy] = useState('') // '' | 'in' | 'up' | 'reset'
  const [emailError, setEmailError] = useState('')
  const [emailNotice, setEmailNotice] = useState('')
  const connected = !!state.settings.syncToken
  const lang = state.settings.lang

  function mapEmailError(code) {
    switch (code) {
      case 'auth/invalid-email': return t('errBadEmail')
      case 'auth/email-already-in-use': return t('errEmailInUse')
      case 'auth/weak-password': return t('errWeakPassword')
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return t('errWrongCreds')
      case 'auth/too-many-requests': return t('errTooManyTries')
      case 'auth/operation-not-allowed':
      case 'auth/configuration-not-found': return t('errEmailProviderDisabled')
      case 'auth/network-request-failed': return t('errAuthNetwork')
      default: return code ? `${t('signInFailed')} (${code})` : t('signInFailed')
    }
  }

  async function emailAuth(kind) {
    setEmailError('')
    setEmailNotice('')
    if (kind === 'reset') {
      if (!email.trim()) { setEmailError(t('resetNeedsEmail')); return }
      setEmailBusy('reset')
      try {
        await actions.resetPassword(email.trim())
        setEmailNotice(t('resetSent'))
      } catch (e) {
        setEmailError(mapEmailError(e?.code || ''))
      } finally {
        setEmailBusy('')
      }
      return
    }
    if (!email.trim() || !pass) return
    setEmailBusy(kind)
    try {
      if (kind === 'up') await actions.signUpEmail(email.trim(), pass)
      else await actions.signInEmail(email.trim(), pass)
      setEmail('')
      setPass('')
    } catch (e) {
      setEmailError(mapEmailError(e?.code || ''))
    } finally {
      setEmailBusy('')
    }
  }

  async function connect() {
    if (!token.trim()) return
    setBusy(true)
    setError('')
    try {
      await actions.connectSync(token)
      setToken('')
      actions.syncNow()
    } catch {
      setError(t('badSyncKey'))
    } finally {
      setBusy(false)
    }
  }

  async function googleSignIn() {
    setGoogleBusy(true)
    setGoogleError('')
    try {
      await actions.signInGoogle()
    } catch (e) {
      const code = e?.code || ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
        // User dismissed the popup — not an error worth showing.
      } else if (code === 'auth/unauthorized-domain') {
        setGoogleError(t('errUnauthorizedDomain'))
      } else if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
        setGoogleError(t('errProviderDisabled'))
      } else if (code === 'auth/popup-blocked') {
        setGoogleError(t('errPopupBlocked'))
      } else if (code === 'auth/network-request-failed') {
        setGoogleError(t('errAuthNetwork'))
      } else {
        setGoogleError(code ? `${t('signInFailed')} (${code})` : t('signInFailed'))
      }
    } finally {
      setGoogleBusy(false)
    }
  }

  const lastSyncText = syncInfo.at
    ? t('lastSync', new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(syncInfo.at))
    : t('syncNever')

  // With Firebase configured, Google sign-in is the primary sync path;
  // once signed in it fully replaces the GitHub-key option in the UI.
  if (firebaseEnabled && fbUser) {
    return (
      <div className="rounded-xl border border-white/10 p-md flex flex-col gap-3 bg-surface-container-low">
        <div className="flex items-center gap-2">
          <Icon name="cloud_sync" className="text-primary-container" />
          <h3 className="text-headline-md text-on-surface">{t('cloudSync')}</h3>
        </div>
        <p className="text-body-md text-on-surface flex items-center gap-2">
          <Icon name="check_circle" filled className="text-primary-container text-base" />
          <span className="truncate" dir="ltr">{fbUser.email || fbUser.displayName || 'Google'}</span>
        </p>
        <p className="text-label-sm text-on-surface-variant">
          {syncInfo.status === 'syncing' ? t('syncing')
            : syncInfo.status === 'error' ? t('syncFailed')
            : lastSyncText}
        </p>
        <div className="flex gap-sm">
          <button
            onClick={() => actions.syncNow()}
            disabled={syncInfo.status === 'syncing'}
            className="px-md py-sm rounded-lg text-label-md bg-primary-container text-[#0d1117] font-bold disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1"
          >
            <Icon name="sync" className="text-base" /> {t('syncNow')}
          </button>
          <button
            onClick={() => actions.signOutGoogle()}
            className="px-md py-sm rounded-lg text-label-md text-error border border-error/30 hover:bg-error/10 transition-colors"
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 p-md flex flex-col gap-3 bg-surface-container-low">
      <div className="flex items-center gap-2">
        <Icon name="cloud_sync" className="text-primary-container" />
        <h3 className="text-headline-md text-on-surface">{t('cloudSync')}</h3>
      </div>

      {firebaseEnabled && (
        <>
          <p className="text-label-sm text-on-surface-variant leading-relaxed">{t('accountSyncHint')}</p>

          {/* Email/password — the primary path; also the only one that works
              inside the Android app's WebView (Google blocks OAuth there) */}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            dir="ltr"
            className="w-full bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            dir="ltr"
            onKeyDown={(e) => { if (e.key === 'Enter') emailAuth('in') }}
            className="w-full bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
          />
          <div className="flex gap-sm">
            <button
              onClick={() => emailAuth('in')}
              disabled={!!emailBusy || !email.trim() || !pass}
              className="flex-1 py-3 rounded-lg bg-primary-container text-[#0d1117] text-label-md font-bold disabled:opacity-40 active:scale-95 transition-all"
            >
              {emailBusy === 'in' ? t('signingIn') : t('signInBtn')}
            </button>
            <button
              onClick={() => emailAuth('up')}
              disabled={!!emailBusy || !email.trim() || !pass}
              className="flex-1 py-3 rounded-lg bg-surface-container-high text-on-surface text-label-md font-bold disabled:opacity-40 hover:bg-white/10 active:scale-95 transition-all"
            >
              {emailBusy === 'up' ? t('signingIn') : t('signUpBtn')}
            </button>
          </div>
          <button
            onClick={() => emailAuth('reset')}
            disabled={!!emailBusy}
            className="self-start text-label-sm text-on-surface-variant hover:text-primary-container hover:underline transition-colors"
          >
            {emailBusy === 'reset' ? t('signingIn') : t('forgotPassword')}
          </button>
          {emailError && <p className="text-label-sm text-error">{emailError}</p>}
          {emailNotice && <p className="text-label-sm text-primary-container">{emailNotice}</p>}

          <div className="flex items-center gap-3 my-1">
            <span className="flex-1 h-px bg-white/10" />
            <span className="text-label-sm text-on-surface-variant">{t('orDivider')}</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={googleSignIn}
            disabled={googleBusy}
            className="w-full py-3 rounded-lg bg-surface-container-high text-on-surface text-label-md font-bold disabled:opacity-40 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="font-bold text-base leading-none">G</span>
            {googleBusy ? t('signingIn') : t('signInGoogleBtn')}
          </button>
          {googleError && <p className="text-label-sm text-error">{googleError}</p>}
          <p className="text-label-sm text-on-surface-variant mt-1">{t('orGistAlt')}</p>
        </>
      )}

      {!connected ? (
        <>
          <p className="text-label-sm text-on-surface-variant leading-relaxed">{t('cloudSyncHint')}</p>
          <a
            href="https://github.com/settings/tokens/new?scopes=gist&description=CineTrack%20Sync"
            target="_blank"
            rel="noreferrer"
            className="text-label-md text-primary-container hover:underline"
          >
            {t('createSyncKey')}
          </a>
          <div className="flex gap-sm">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('syncKeyPlaceholder')}
              dir="ltr"
              className="flex-1 min-w-0 bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
            />
            <button
              onClick={connect}
              disabled={busy || !token.trim()}
              className="px-md py-sm rounded-lg text-label-md bg-primary-container text-[#0d1117] font-bold disabled:opacity-40 active:scale-95 transition-all flex-none"
            >
              {busy ? t('connecting') : t('connect')}
            </button>
          </div>
          {error && <p className="text-label-sm text-error">{error}</p>}
        </>
      ) : (
        <>
          <p className="text-body-md text-on-surface flex items-center gap-2">
            <Icon name="check_circle" filled className="text-primary-container text-base" />
            {t('connectedAs', state.settings.syncUser || 'GitHub')}
          </p>
          <p className="text-label-sm text-on-surface-variant">
            {syncInfo.status === 'syncing' ? t('syncing')
              : syncInfo.status === 'error' ? t('syncFailed')
              : lastSyncText}
          </p>
          <div className="flex gap-sm">
            <button
              onClick={() => actions.syncNow()}
              disabled={syncInfo.status === 'syncing'}
              className="px-md py-sm rounded-lg text-label-md bg-primary-container text-[#0d1117] font-bold disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1"
            >
              <Icon name="sync" className="text-base" /> {t('syncNow')}
            </button>
            <button
              onClick={() => actions.disconnectSync()}
              className="px-md py-sm rounded-lg text-label-md text-error border border-error/30 hover:bg-error/10 transition-colors"
            >
              {t('disconnectSync')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SettingsSheet({ open, onClose }) {
  const { state, actions, t } = useApp()
  const fileRef = useRef(null)
  const [key, setKey] = useState(state.settings.tmdbKey)

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="p-md pt-12 flex flex-col gap-lg pb-8">
        <h2 className="text-headline-lg-mobile text-on-surface">{t('settings')}</h2>

        <CloudSyncSection />

        <div>
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider">{t('language')}</label>
          <div className="flex gap-sm mt-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => actions.updateSettings({ lang: l.code })}
                className={`px-md py-sm rounded-full text-label-md transition-all ${
                  state.settings.lang === l.code
                    ? 'bg-primary-container text-[#0d1117] font-bold'
                    : 'bg-surface-container-high text-on-surface hover:bg-white/10'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {!TMDB_PROXY && (
          <div>
            <label className="text-label-md text-on-surface-variant uppercase tracking-wider">{t('tmdbKey')}</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onBlur={() => actions.updateSettings({ tmdbKey: key.trim() })}
              placeholder="eyJhbGciOi… / 32-char key"
              dir="ltr"
              className="mt-2 w-full bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
            />
            <p className="text-label-sm text-on-surface-variant mt-2 leading-relaxed">{t('tmdbKeyHint')}</p>
          </div>
        )}

        <div className="flex flex-col gap-sm">
          <QuickRow icon="download" label={t('exportData')} onClick={() => actions.exportData()} />
          <QuickRow
            icon="upload"
            label={t('importData')}
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                actions.importData(await file.text())
                onClose()
              } catch {
                alert('Invalid backup file')
              }
              e.target.value = ''
            }}
          />
          <QuickRow
            icon="delete_forever"
            label={t('resetData')}
            danger
            onClick={() => {
              if (confirm(t('resetConfirm'))) {
                actions.resetData()
                onClose()
              }
            }}
          />
        </div>

        <p className="text-label-sm text-on-surface-variant leading-relaxed">
          {t('dataSaved')} {t('installHint')}
        </p>
      </div>
    </Sheet>
  )
}

function EditProfileSheet({ open, onClose }) {
  const { state, actions, t } = useApp()
  const [name, setName] = useState(state.settings.name)
  const [tagline, setTagline] = useState(state.settings.tagline)

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="p-md pt-12 flex flex-col gap-md pb-8">
        <h2 className="text-headline-lg-mobile text-on-surface">{t('editProfile')}</h2>
        <div>
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider">{t('yourName')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            dir="auto"
            className="mt-2 w-full bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
          />
        </div>
        <div>
          <label className="text-label-md text-on-surface-variant uppercase tracking-wider">{t('yourTagline')}</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={t('defaultTagline')}
            dir="auto"
            className="mt-2 w-full bg-[#121212] border border-white/10 focus:border-primary-container outline-none rounded-lg px-3 py-2.5 text-body-md text-on-surface transition-colors"
          />
        </div>
        <div className="flex gap-sm justify-end mt-2">
          <button className="px-md py-sm rounded-lg text-label-md text-on-surface hover:bg-white/10" onClick={onClose}>
            {t('cancel')}
          </button>
          <button
            className="px-md py-sm rounded-lg text-label-md bg-primary-container text-[#0d1117] font-bold active:scale-95 transition-transform"
            onClick={() => {
              actions.updateSettings({ name: name.trim() || 'Cinema Fan', tagline: tagline.trim() })
              onClose()
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function HistorySheet({ open, onClose }) {
  const { state, t } = useApp()
  const items = watchHistory(state, 50)
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="p-md pt-12 pb-8">
        <h2 className="text-headline-lg-mobile text-on-surface mb-md">{t('watchHistory')}</h2>
        {items.length === 0 && <p className="text-body-md text-on-surface-variant">{t('emptyHistory')}</p>}
        <ul className="flex flex-col">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5">
              <Icon
                name={it.kind === 'movie' ? 'movie' : 'tv'}
                className="text-on-surface-variant flex-none"
              />
              <span className="flex-1 text-body-md text-on-surface truncate" dir="auto">
                {it.kind === 'movie' ? it.movie.title : it.show.name}
              </span>
              {it.kind === 'episode' && (
                <span className="text-label-md text-primary-container flex-none" dir="ltr">
                  S{it.s}E{it.e}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

function GenresSheet({ open, onClose }) {
  const { state, t } = useApp()
  const genres = topGenres(state, 10)
  const max = genres[0]?.[1] || 1
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="p-md pt-12 pb-8">
        <h2 className="text-headline-lg-mobile text-on-surface mb-md">{t('favoriteGenres')}</h2>
        <div className="flex flex-col gap-3">
          {genres.map(([g, n]) => (
            <div key={g}>
              <div className="flex justify-between text-body-md text-on-surface mb-1">
                <span>{g}</span>
                <span className="text-on-surface-variant" dir="ltr">{n}</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary-container" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

export default function ProfileScreen() {
  const { state, t } = useApp()
  const [sheet, setSheet] = useState(null) // 'settings' | 'edit' | 'history' | 'genres' | 'achievements'
  const stats = computeStats(state)
  const achievements = computeAchievements(stats)
  const unlockedFirst = [...achievements].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))
  const sinceYear = new Date(state.seededAt || Date.now()).getFullYear()
  const initial = (state.settings.name || 'C').trim().charAt(0).toUpperCase()

  return (
    <main className="mt-16 max-w-[900px] mx-auto pb-12">
      {/* header row with settings gear (design: top-right) */}
      <div className="flex justify-end px-margin-mobile pt-4">
        <button
          className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all"
          onClick={() => setSheet('settings')}
          aria-label={t('settings')}
        >
          <Icon name="settings" className="text-on-surface" />
        </button>
      </div>

      {/* Avatar + identity */}
      <section className="flex flex-col items-center gap-3 px-margin-mobile pb-lg">
        <div className="relative">
          <div
            className="w-32 h-32 rounded-full border-[3px] border-primary-container flex items-center justify-center text-5xl font-bold text-primary-container"
            style={{ background: 'linear-gradient(160deg, #201f1f, #0e0e0e)' }}
          >
            {initial}
          </div>
          <button
            className="absolute bottom-1 end-1 w-9 h-9 rounded-full bg-primary-container text-[#0d1117] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            onClick={() => setSheet('edit')}
            aria-label={t('editProfile')}
          >
            <Icon name="edit" filled className="text-lg" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-headline-lg-mobile md:text-headline-lg text-on-surface" dir="auto">{state.settings.name}</h2>
          <p className="text-body-md text-on-surface-variant" dir="auto">
            {state.settings.tagline || `${t('defaultTagline')} • ${sinceYear}`}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-gutter px-margin-mobile pb-lg">
        <StatCard value={stats.moviesWatched} label={t('movies')} />
        <StatCard value={stats.showsTracked} label={t('shows')} />
        <StatCard
          value={stats.episodesWatched >= 1000 ? `${(stats.episodesWatched / 1000).toFixed(1)}k` : stats.episodesWatched}
          label={t('episodes')}
        />
        <StatCard value={fmtTotalTime(stats.totalMinutes, t)} label={t('totalTime')} />
      </section>

      {/* Achievements */}
      <section className="pb-lg">
        <div className="flex items-center justify-between px-margin-mobile mb-md">
          <h3 className="text-headline-md text-on-surface">{t('achievements')}</h3>
          <button className="text-label-md text-primary-container hover:underline" onClick={() => setSheet('achievements')}>
            {t('viewAll')}
          </button>
        </div>
        <div className="flex gap-md overflow-x-auto hide-scrollbar px-margin-mobile">
          {unlockedFirst.map((a) => (
            <Achievement key={a.id} a={a} t={t} />
          ))}
        </div>
      </section>

      {/* Quick Access */}
      <section className="px-margin-mobile flex flex-col gap-sm">
        <h3 className="text-headline-md text-on-surface mb-1">{t('quickAccess')}</h3>
        <QuickRow icon="favorite" label={t('favoriteGenres')} onClick={() => setSheet('genres')} />
        <QuickRow icon="history" label={t('watchHistory')} onClick={() => setSheet('history')} />
        <QuickRow icon="settings" label={t('settings')} onClick={() => setSheet('settings')} />
      </section>

      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} />
      <EditProfileSheet open={sheet === 'edit'} onClose={() => setSheet(null)} />
      <HistorySheet open={sheet === 'history'} onClose={() => setSheet(null)} />
      <GenresSheet open={sheet === 'genres'} onClose={() => setSheet(null)} />

      {/* All achievements */}
      <Sheet open={sheet === 'achievements'} onClose={() => setSheet(null)}>
        <div className="p-md pt-12 pb-8">
          <h2 className="text-headline-lg-mobile text-on-surface mb-md">{t('achievements')}</h2>
          <ul className="flex flex-col gap-3">
            {achievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border flex-none ${
                    a.unlocked
                      ? 'bg-primary-container/90 border-primary-container text-[#0d1117]'
                      : 'bg-surface-container-high border-white/10 text-on-surface-variant opacity-60'
                  }`}
                >
                  <Icon name={a.icon} filled={a.unlocked} />
                </div>
                <div>
                  <p className="text-body-lg text-on-surface font-semibold">{t(a.nameKey)}</p>
                  <p className="text-label-md text-on-surface-variant">{t(a.descKey)}</p>
                </div>
                {a.unlocked && <Icon name="check_circle" filled className="text-primary-container ms-auto" />}
              </li>
            ))}
          </ul>
        </div>
      </Sheet>
    </main>
  )
}
