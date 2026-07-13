// Native → web deep-link bridge. When a home-screen widget is tapped,
// MainActivity stashes the show id in Capacitor Preferences under
// "widget_open_show"; the app reads and clears it here, then opens that
// show. No-op on the web (nothing writes the key there).
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

export async function consumePendingShow() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { value } = await Preferences.get({ key: 'widget_open_show' })
    if (value) {
      await Preferences.remove({ key: 'widget_open_show' })
      return value
    }
  } catch { /* best-effort */ }
  return null
}
