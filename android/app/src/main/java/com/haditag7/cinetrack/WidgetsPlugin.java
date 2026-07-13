package com.haditag7.cinetrack;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tiny bridge so the web app can force both widgets to re-render right
// after it writes fresh data (otherwise they only refresh on the 30-min
// system schedule).
@CapacitorPlugin(name = "Widgets")
public class WidgetsPlugin extends Plugin {

    @PluginMethod
    public void refresh(PluginCall call) {
        try {
            UpcomingWidget.updateAll(getContext());
            ProgressWidget.updateAll(getContext());
        } catch (Exception ignored) {
            // best-effort
        }
        call.resolve();
    }
}
