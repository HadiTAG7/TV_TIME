package com.haditag7.cinetrack;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

// "Today & upcoming episodes" home-screen widget, TV Time style:
// yellow header bar, one row per episode with poster thumbnail,
// network pill + episode code, and the (relative) air date.
public class UpcomingWidget extends AppWidgetProvider {
    private static final int MAX_ROWS = 6;
    private static final int[] ROWS = { R.id.row1, R.id.row2, R.id.row3, R.id.row4, R.id.row5, R.id.row6 };
    private static final int[] SEPS = { 0, R.id.sep2, R.id.sep3, R.id.sep4, R.id.sep5, R.id.sep6 };
    private static final int[] POSTER = { R.id.row1_poster, R.id.row2_poster, R.id.row3_poster, R.id.row4_poster, R.id.row5_poster, R.id.row6_poster };
    private static final int[] TITLE = { R.id.row1_title, R.id.row2_title, R.id.row3_title, R.id.row4_title, R.id.row5_title, R.id.row6_title };
    private static final int[] NETWORK = { R.id.row1_network, R.id.row2_network, R.id.row3_network, R.id.row4_network, R.id.row5_network, R.id.row6_network };
    private static final int[] EP = { R.id.row1_ep, R.id.row2_ep, R.id.row3_ep, R.id.row4_ep, R.id.row5_ep, R.id.row6_ep };
    private static final int[] DATE = { R.id.row1_date, R.id.row2_date, R.id.row3_date, R.id.row4_date, R.id.row5_date, R.id.row6_date };
    private static final int[] TIME = { R.id.row1_time, R.id.row2_time, R.id.row3_time, R.id.row4_time, R.id.row5_time, R.id.row6_time };

    private static final int TODAY_COLOR = 0xFFF5C518;
    private static final int DATE_COLOR = 0xFFFFFFFF;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) render(context, manager, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        render(context, manager, appWidgetId);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, UpcomingWidget.class));
        if (ids == null) return;
        for (int id : ids) render(context, manager, id);
    }

    // Poster downloads must run off the main thread; the update is pushed
    // once the RemoteViews (bitmaps included) is fully built.
    private static void render(final Context context, final AppWidgetManager manager, final int appWidgetId) {
        Bundle options = manager.getAppWidgetOptions(appWidgetId);
        final int heightDp = options != null
            ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0) : 0;
        new Thread(() -> {
            try {
                manager.updateAppWidget(appWidgetId, build(context, heightDp));
            } catch (Exception ignored) { /* widget updates are best-effort */ }
        }).start();
    }

    private static RemoteViews build(Context context, int heightDp) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upcoming);
        views.setOnClickPendingIntent(R.id.widget_root, WidgetData.openApp(context));

        JSONObject data = WidgetData.read(context);
        String title = data != null ? data.optString("upcomingTitle", "Upcoming") : "Upcoming";
        views.setTextViewText(R.id.title, title);

        // Rows that actually fit: header ≈36dp, each row ≈69dp.
        int fit = heightDp > 0 ? (heightDp - 36) / 69 : 4;
        int maxRows = Math.max(1, Math.min(MAX_ROWS, fit));

        JSONArray upcoming = data != null ? data.optJSONArray("upcoming") : null;
        int count = upcoming != null ? Math.min(upcoming.length(), maxRows) : 0;

        int posterW = WidgetData.dp(context, 40);
        int posterH = WidgetData.dp(context, 57);
        float radius = WidgetData.dp(context, 5);

        for (int i = 0; i < MAX_ROWS; i++) {
            boolean visible = i < count;
            views.setViewVisibility(ROWS[i], visible ? View.VISIBLE : View.GONE);
            if (SEPS[i] != 0) views.setViewVisibility(SEPS[i], visible ? View.VISIBLE : View.GONE);
            if (!visible) continue;

            JSONObject item = upcoming.optJSONObject(i);
            if (item == null) continue;

            // Rich fields with fallback to the legacy line1/line2 payload.
            String showTitle = item.optString("title", item.optString("line2", ""));
            views.setTextViewText(TITLE[i], showTitle);
            views.setTextViewText(EP[i], item.optString("ep", ""));
            views.setTextViewText(DATE[i], item.optString("date", item.optString("line1", "")));
            views.setTextViewText(TIME[i], item.optString("time", ""));
            views.setTextColor(DATE[i], item.optBoolean("today", false) ? TODAY_COLOR : DATE_COLOR);

            String network = item.optString("network", "");
            views.setViewVisibility(NETWORK[i], network.isEmpty() ? View.GONE : View.VISIBLE);
            views.setTextViewText(NETWORK[i], network);

            Bitmap poster = WidgetData.loadPoster(context, item.optString("poster", ""), posterW, posterH, radius);
            if (poster != null) views.setImageViewBitmap(POSTER[i], poster);
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
