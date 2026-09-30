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

  // Real permission and GPS state without showing any dialog (the WebView Permissions API always says "prompt")
  @PluginMethod
  public void locationStatus(PluginCall call) {
    JSObject r = new JSObject();
    android.content.Context ctx = getContext();
    boolean fine = androidx.core.content.ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    boolean coarse = androidx.core.content.ContextCompat.checkSelfPermission(ctx, android.Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    boolean enabled = false;
    try {
      android.location.LocationManager lm = (android.location.LocationManager) ctx.getSystemService(android.content.Context.LOCATION_SERVICE);
      enabled = lm != null && androidx.core.location.LocationManagerCompat.isLocationEnabled(lm);
    } catch (RuntimeException ignored) {}
    r.put("granted", fine || coarse);
    r.put("precise", fine);
    r.put("servicesEnabled", enabled);
    call.resolve(r);
  }
}
