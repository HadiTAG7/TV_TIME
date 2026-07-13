package com.haditag7.cinetrack;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetsPlugin.class);
        super.onCreate(savedInstanceState);
        stashPendingShow(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        stashPendingShow(intent);
    }

    // A widget tap can carry the show to open. Hand it to the web layer via
    // the same Preferences store it already reads (key "widget_open_show");
    // the web app consumes it on load / when it regains focus and deep-links
    // to that show's detail.
    private void stashPendingShow(Intent intent) {
        if (intent == null) return;
        String id = intent.getStringExtra("open_show");
        if (id == null || id.isEmpty()) return;
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        prefs.edit().putString("widget_open_show", id).apply();
    }
}
