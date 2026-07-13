package com.haditag7.cinetrack;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

// "Today & upcoming episodes" home-screen widget.
public class UpcomingWidget extends AppWidgetProvider {
    private static final int[] ROWS = { R.id.row1, R.id.row2, R.id.row3, R.id.row4 };
    private static final int[] LINE1 = { R.id.row1_line1, R.id.row2_line1, R.id.row3_line1, R.id.row4_line1 };
    private static final int[] LINE2 = { R.id.row1_line2, R.id.row2_line2, R.id.row3_line2, R.id.row4_line2 };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, UpcomingWidget.class));
        if (ids != null && ids.length > 0) {
            manager.updateAppWidget(ids, build(context));
        }
    }

    private static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upcoming);
        views.setOnClickPendingIntent(R.id.widget_root, WidgetData.openApp(context));

        JSONObject data = WidgetData.read(context);
        String title = data != null ? data.optString("upcomingTitle", "Upcoming") : "Upcoming";
        views.setTextViewText(R.id.title, title);

        JSONArray upcoming = data != null ? data.optJSONArray("upcoming") : null;
        int count = upcoming != null ? Math.min(upcoming.length(), ROWS.length) : 0;

        for (int i = 0; i < ROWS.length; i++) {
            if (i < count) {
                JSONObject item = upcoming.optJSONObject(i);
                views.setViewVisibility(ROWS[i], View.VISIBLE);
                views.setTextViewText(LINE1[i], item != null ? item.optString("line1", "") : "");
                views.setTextViewText(LINE2[i], item != null ? item.optString("line2", "") : "");
            } else {
                views.setViewVisibility(ROWS[i], View.GONE);
            }
        }

        if (count == 0) {
            views.setViewVisibility(R.id.empty, View.VISIBLE);
            String empty = data != null
                ? data.optString("upcomingEmpty", "Open CineTrack to load your shows.")
                : "Open CineTrack to load your shows.";
            views.setTextViewText(R.id.empty, empty);
        } else {
            views.setViewVisibility(R.id.empty, View.GONE);
        }
        return views;
    }
}
