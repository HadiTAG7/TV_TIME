// Date/time formatting localized to the UI language.
export function fmtDate(isoDate, lang) {
  if (!isoDate) return ''
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoDate + 'T12:00:00'))
  } catch {
    return isoDate
  }
}

export function fmtWeekday(isoDate, lang) {
  if (!isoDate) return ''
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(new Date(isoDate + 'T12:00:00'))
  } catch {
    return isoDate
  }
}

// "42d" / "18h" style total-time badge like the design's stat cards.
export function fmtTotalTime(minutes, t) {
  const days = Math.floor(minutes / (60 * 24))
  if (days >= 1) return t('days', days)
  return t('hours', Math.max(1, Math.round(minutes / 60)))
}

export function daysFromToday(isoDate) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const d = new Date(isoDate + 'T12:00:00')
  return Math.round((d - today) / (24 * 60 * 60 * 1000))
}
