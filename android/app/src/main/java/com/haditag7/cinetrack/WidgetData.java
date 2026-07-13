package com.haditag7.cinetrack;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// Shared helpers: the web app writes localized widget content into the
// Capacitor Preferences store ("CapacitorStorage" SharedPreferences file,
// key "widget_data"); widgets only read and display it.
final class WidgetData {
    private WidgetData() {}

    static JSONObject read(Context context) {
        try {
            SharedPreferences prefs =
                context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = prefs.getString("widget_data", null);
            if (raw == null) return null;
            return new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }

    static PendingIntent openApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // Opens the app straight to a specific show. The show id rides along as
    // an extra that MainActivity hands to the web layer to deep-link.
    static PendingIntent openShow(Context context, String id) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("open_show", id);
        // Unique data per id so distinct shows get distinct PendingIntents
        // (otherwise FLAG_UPDATE_CURRENT would reuse the first show's extra).
        intent.setData(android.net.Uri.parse("cinetrack://show/" + id));
        return PendingIntent.getActivity(
            context, ("show" + id).hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // Template for a collection (ListView) — must be mutable so each row's
    // fill-in intent can merge into it.
    static PendingIntent openAppTemplate(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        return PendingIntent.getActivity(context, 1, intent, flags);
    }

    static int dp(Context context, float dp) {
        return Math.round(dp * context.getResources().getDisplayMetrics().density);
    }

    // Poster thumbnail for RemoteViews: downloaded once (disk-cached),
    // center-cropped to the target size and given rounded corners.
    // Must be called off the main thread. Returns null on any failure —
    // the ImageView then just shows its placeholder background.
    static Bitmap loadPoster(Context context, String url, int wPx, int hPx, float radiusPx) {
        if (url == null || url.isEmpty() || !url.startsWith("http")) return null;
        try {
            File dir = new File(context.getCacheDir(), "widget_posters");
            //noinspection ResultOfMethodCallIgnored
            dir.mkdirs();
            File file = new File(dir, Integer.toHexString(url.hashCode()) + ".jpg");
            Bitmap src = file.exists() ? BitmapFactory.decodeFile(file.getAbsolutePath()) : null;
            if (src == null) {
                HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);
                try (InputStream in = conn.getInputStream()) {
                    src = BitmapFactory.decodeStream(in);
                } finally {
                    conn.disconnect();
                }
                if (src != null) {
                    try (FileOutputStream out = new FileOutputStream(file)) {
                        src.compress(Bitmap.CompressFormat.JPEG, 88, out);
                    }
                }
            }
            if (src == null) return null;

            Bitmap result = Bitmap.createBitmap(wPx, hPx, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(result);
            float scale = Math.max((float) wPx / src.getWidth(), (float) hPx / src.getHeight());
            Matrix matrix = new Matrix();
            matrix.setScale(scale, scale);
            matrix.postTranslate(
                (wPx - src.getWidth() * scale) / 2f,
                (hPx - src.getHeight() * scale) / 2f);
            BitmapShader shader = new BitmapShader(src, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
            shader.setLocalMatrix(matrix);
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setShader(shader);
            canvas.drawRoundRect(new RectF(0, 0, wPx, hPx), radiusPx, radiusPx, paint);
            return result;
        } catch (Exception | OutOfMemoryError e) {
            return null;
        }
    }
}
