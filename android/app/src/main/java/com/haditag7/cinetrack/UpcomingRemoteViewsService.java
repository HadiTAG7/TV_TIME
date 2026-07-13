package com.haditag7.cinetrack;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

// Backs the scrollable episode ListView in the Upcoming widget. Each row is
// its own small RemoteViews delivered separately by the framework, so there
// is no single-transaction size limit and the list can be as long as we like.
public class UpcomingRemoteViewsService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    static class Factory implements RemoteViewsService.RemoteViewsFactory {
        private static final int TODAY_COLOR = 0xFFF5C518;
        private static final int DATE_COLOR = 0xFFFFFFFF;
        // Small fixed poster (px) — crisp in the ~40dp thumbnail, cheap to send.
        private static final int POSTER_W = 84;
        private static final int POSTER_H = 120;
        private static final float POSTER_RADIUS = 8f;

        private final Context context;
        private JSONArray items = new JSONArray();

        Factory(Context context) {
            this.context = context;
        }

        private void load() {
            JSONObject data = WidgetData.read(context);
            JSONArray arr = data != null ? data.optJSONArray("upcoming") : null;
            items = arr != null ? arr : new JSONArray();
        }

        @Override public void onCreate() { load(); }
        @Override public void onDataSetChanged() { load(); }
        @Override public void onDestroy() { items = new JSONArray(); }
        @Override public int getCount() { return items.length(); }
        @Override public long getItemId(int position) { return position; }
        @Override public boolean hasStableIds() { return true; }
        @Override public int getViewTypeCount() { return 1; }
        @Override public RemoteViews getLoadingView() { return null; }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_upcoming_item);
            JSONObject item = items.optJSONObject(position);
            if (item == null) return row;

            String title = item.optString("title", item.optString("line2", ""));
            row.setTextViewText(R.id.item_title, title);
            row.setTextViewText(R.id.item_ep, item.optString("ep", ""));
            row.setTextViewText(R.id.item_date, item.optString("date", item.optString("line1", "")));
            row.setTextViewText(R.id.item_time, item.optString("time", ""));
            row.setTextColor(R.id.item_date, item.optBoolean("today", false) ? TODAY_COLOR : DATE_COLOR);

            String network = item.optString("network", "");
            row.setViewVisibility(R.id.item_network, network.isEmpty() ? android.view.View.GONE : android.view.View.VISIBLE);
            row.setTextViewText(R.id.item_network, network);

            // getViewAt runs on a binder thread, so blocking poster I/O is
            // fine here; loadPoster disk-caches so it's fast after the first.
            Bitmap poster = WidgetData.loadPoster(context, item.optString("poster", ""), POSTER_W, POSTER_H, POSTER_RADIUS);
            if (poster != null) row.setImageViewBitmap(R.id.item_poster, poster);

            // Tapping a row opens the app straight to that show. The id is
            // merged into the ListView's (mutable) template intent.
            Intent fill = new Intent();
            String id = item.optString("id", "");
            if (!id.isEmpty()) fill.putExtra("open_show", id);
            row.setOnClickFillInIntent(R.id.item_root, fill);
            return row;
        }
    }
}
