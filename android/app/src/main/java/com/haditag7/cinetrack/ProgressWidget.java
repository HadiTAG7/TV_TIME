package com.haditag7.cinetrack;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

// "Current show progress" home-screen widget: poster + title + colored bar.
public class ProgressWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        render(context, manager, appWidgetIds);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ProgressWidget.class));
        if (ids != null && ids.length > 0) render(context, manager, ids);
    }

    // Poster download runs off the main thread.
    private static void render(final Context context, final AppWidgetManager manager, final int[] ids) {
        new Thread(() -> {
            try {
                manager.updateAppWidget(ids, build(context));
            } catch (Exception ignored) { /* widget updates are best-effort */ }
        }).start();
    }

    private static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_progress);

        JSONObject data = WidgetData.read(context);
        JSONObject current = data != null ? data.optJSONObject("current") : null;

        // Tap opens the app straight to this show (falls back to home if we
        // somehow don't have an id yet).
        String showId = current != null ? current.optString("id", "") : "";
        views.setOnClickPendingIntent(R.id.widget_root,
            showId.isEmpty() ? WidgetData.openApp(context) : WidgetData.openShow(context, showId));
        String title = data != null ? data.optString("currentTitle", "Watching") : "Watching";
        views.setTextViewText(R.id.title, title);

        if (current != null) {
            views.setViewVisibility(R.id.show_title, View.VISIBLE);
            views.setViewVisibility(R.id.progress, View.VISIBLE);
            views.setViewVisibility(R.id.empty, View.GONE);
            views.setTextViewText(R.id.show_title, current.optString("title", ""));
            views.setTextViewText(R.id.sub, current.optString("sub", ""));
            views.setTextViewText(R.id.pct, current.optString("pctText", ""));
            views.setProgressBar(R.id.progress, 100, current.optInt("pct", 0), false);

            Bitmap poster = WidgetData.loadPoster(
                context, current.optString("poster", ""),
                WidgetData.dp(context, 52), WidgetData.dp(context, 74), WidgetData.dp(context, 6));
            if (poster != null) {
                views.setImageViewBitmap(R.id.poster, poster);
                views.setViewVisibility(R.id.poster, View.VISIBLE);
            }
        } else {
            views.setViewVisibility(R.id.show_title, View.GONE);
            views.setViewVisibility(R.id.progress, View.GONE);
            views.setTextViewText(R.id.sub, "");
            views.setTextViewText(R.id.pct, "");
            views.setViewVisibility(R.id.empty, View.VISIBLE);
            String empty = data != null
                ? data.optString("upcomingEmpty", "Open CineTrack to load your shows.")
                : "Open CineTrack to load your shows.";
            views.setTextViewText(R.id.empty, empty);
        }
        return views;
    }
}
