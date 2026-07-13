// Android home-screen widget bridge. The app pre-renders localized strings
// so the native side (Kotlin RemoteViews) only displays them.
// Data flows: store state → buildWidgetPayload() → Capacitor Preferences
// (SharedPreferences "CapacitorStorage", key "widget_data") → AppWidgets.
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { registerPlugin } from '@capacitor/core'
import { allUpcoming, showProgress } from './progress.js'
import { fmtDate, fmtWeekday, daysFromToday } from './format.js'

// Small poster rendition for widget thumbnails (data saver + fast decode).
function widgetPoster(url) {
  if (!url) return ''
  return url.replace(/\/(w\d+|original)\//, '/w154/')
}

// Pure + unit-testable: derives both widgets' content from app state.
// Keys line1/line2 are kept for widgets shipped in older APKs; the
// TV Time-style widgets read the richer fields (title/ep/network/date/…).
export function buildWidgetPayload(state, t) {
  const lang = state.settings.lang

  // The Android list widget scrolls, so we can surface a long runway of
  // episodes — every future episode across all shows, not just the next one
  // per show (matches TV Time's schedule view).
  const upcoming = allUpcoming(state.shows, 50).map((u) => {
    const d = daysFromToday(u.ep.air)
    const when = d <= 0 ? t('today') : d === 1 ? t('tomorrow') : fmtDate(u.ep.air, lang)
    const date = d <= 0 ? t('today')
      : d === 1 ? t('tomorrow')
      : d <= 7 ? fmtWeekday(u.ep.air, lang)
      : fmtDate(u.ep.air, lang)
    return {
      line1: [when, u.show.network].filter(Boolean).join(' • '),
      line2: `${u.show.name} — S${String(u.season).padStart(2, '0')}E${String(u.ep.n).padStart(2, '0')}`,
      today: d <= 0,
      id: String(u.show.id),
      title: u.show.name,
      ep: `S${String(u.season).padStart(2, '0')} | E${String(u.ep.n).padStart(2, '0')}`,
      network: u.show.network || '',
      date,
      time: u.show.airTime || '',
      poster: widgetPoster(u.show.poster),
    }
  })

  // Current show: the most recently touched one that's mid-watch.
  const candidate = Object.values(state.shows)
    .filter((s) => s.status === 'watching')
    .map((s) => ({ show: s, prog: showProgress(s) }))
    .filter((x) => x.prog.watchedEps > 0 && x.prog.nextEp)
    .sort((a, b) => (b.show.updatedAt || 0) - (a.show.updatedAt || 0))[0]

  const current = candidate
    ? {
        id: String(candidate.show.id),
        title: candidate.show.name,
        sub: `S${candidate.prog.currentSeason} • E${candidate.prog.seasonWatched}/${candidate.prog.seasonTotal}`,
        pct: candidate.prog.pct,
        pctText: t('percentDone', candidate.prog.pct),
        next: candidate.prog.nextEp
          ? `S${String(candidate.prog.nextEp.season).padStart(2, '0')} | E${String(candidate.prog.nextEp.ep.n).padStart(2, '0')}`
          : '',
        poster: widgetPoster(candidate.show.poster),
      }
    : null

  return {
    upcomingTitle: t('upcoming'),
    upcomingEmpty: t('emptyUpcoming'),
    currentTitle: t('watching'),
    upcoming,
    current,
    rtl: lang === 'ar',
    updatedAt: Date.now(),
  }
}

const WidgetsPlugin = Capacitor.isNativePlatform()
  ? registerPlugin('Widgets')
  : null

// Fire-and-forget: store the payload and poke the widgets to re-render.
export async function pushWidgetData(state, t) {
  if (!Capacitor.isNativePlatform()) return
  try {
    const payload = buildWidgetPayload(state, t)
    await Preferences.set({ key: 'widget_data', value: JSON.stringify(payload) })
    await WidgetsPlugin?.refresh?.()
  } catch { /* widgets are best-effort; never disturb the app */ }
}
