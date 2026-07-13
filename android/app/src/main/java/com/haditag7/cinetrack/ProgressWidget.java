package com.haditag7.cinetrack;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

// "Current show progress" home-screen widget.
public class ProgressWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ProgressWidget.class));
        if (ids != null && ids.length > 0) {
            manager.updateAppWidget(ids, build(context));
        }
    }

    private static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_progress);
        views.setOnClickPendingIntent(R.id.widget_root, WidgetData.openApp(context));

        JSONObject data = WidgetData.read(context);
        JSONObject current = data != null ? data.optJSONObject("current") : null;
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
