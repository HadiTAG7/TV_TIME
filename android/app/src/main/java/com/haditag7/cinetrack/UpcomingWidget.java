package com.haditag7.cinetrack;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

// "Today & upcoming episodes" widget, TV Time style: a yellow header over a
// scrollable list (RemoteViewsService-backed) so it shows as many episodes
// as you have, not a fixed handful.
public class UpcomingWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) manager.updateAppWidget(id, build(context, manager, id));
        // Ask the list adapters to reload their data.
        manager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.list);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, UpcomingWidget.class));
        if (ids == null || ids.length == 0) return;
        for (int id : ids) manager.updateAppWidget(id, build(context, manager, id));
        manager.notifyAppWidgetViewDataChanged(ids, R.id.list);
    }

    private static RemoteViews build(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_upcoming);

        JSONObject data = WidgetData.read(context);
        String title = data != null ? data.optString("upcomingTitle", "Upcoming") : "Upcoming";
        views.setTextViewText(R.id.title, title);

        JSONArray upcoming = data != null ? data.optJSONArray("upcoming") : null;
        boolean hasItems = upcoming != null && upcoming.length() > 0;

        // Point the ListView at the RemoteViewsService adapter. A unique data
        // URI per widget id keeps multiple instances from sharing a factory.
        Intent svc = new Intent(context, UpcomingRemoteViewsService.class);
        svc.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        svc.setData(android.net.Uri.parse("cinetrack://upcoming/" + appWidgetId));
        views.setRemoteAdapter(R.id.list, svc);
        views.setEmptyView(R.id.list, R.id.empty);

        // One tap anywhere (a row, or the empty state) opens the app. Rows use
        // fill-in intents against this template; the empty view uses its own.
        views.setPendingIntentTemplate(R.id.list, WidgetData.openAppTemplate(context));
        views.setOnClickPendingIntent(R.id.empty, WidgetData.openApp(context));

        String empty = data != null
            ? data.optString("upcomingEmpty", "Open CineTrack to load your shows.")
            : "Open CineTrack to load your shows.";
        views.setTextViewText(R.id.empty, empty);
        views.setViewVisibility(R.id.empty, hasItems ? View.GONE : View.VISIBLE);

        return views;
    }
}
