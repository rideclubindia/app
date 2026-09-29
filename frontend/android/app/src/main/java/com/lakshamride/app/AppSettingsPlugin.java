package com.lakshamride.app;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Opens this app's system settings page so a rider can re-enable a permission they blocked
@CapacitorPlugin(name = "AppSettings")
public class AppSettingsPlugin extends Plugin {

  @PluginMethod
  public void open(PluginCall call) {
    JSObject r = new JSObject();
    try {
      Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", getContext().getPackageName(), null));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      r.put("opened", true);
    } catch (Exception e) {
      r.put("opened", false);
    }
    call.resolve(r);
  }

  @PluginMethod
  public void openLocationServices(PluginCall call) {
    JSObject r = new JSObject();
    try {
      Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);
      r.put("opened", true);
    } catch (Exception e) {
      r.put("opened", false);
    }
    call.resolve(r);
  }
}
