package com.lakshamride.app;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.ArrayList;

// Emergency SMS transport for SOS: direct send with real radio "sent"/"delivered" results, or the SMS composer.
@CapacitorPlugin(
  name = "SosSms",
  permissions = { @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS }) }
)
public class SosSmsPlugin extends Plugin {

  private static final String ACTION_SENT = "com.lakshamride.app.SOS_SMS_SENT";
  private static final String ACTION_DELIVERED = "com.lakshamride.app.SOS_SMS_DELIVERED";

  private final BroadcastReceiver resultReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context ctx, Intent intent) {
      JSObject ev = new JSObject();
      ev.put("eventId", intent.getStringExtra("eventId"));
      ev.put("number", intent.getStringExtra("number"));
      int code = getResultCode();
      if (ACTION_SENT.equals(intent.getAction())) {
        ev.put("state", code == Activity.RESULT_OK ? "sent" : "failed");
        ev.put("errorCode", code);
      } else {
        ev.put("state", code == Activity.RESULT_OK ? "delivered" : "delivery_failed");
      }
      notifyListeners("smsStatus", ev, true);
    }
  };

  @Override
  public void load() {
    IntentFilter filter = new IntentFilter();
    filter.addAction(ACTION_SENT);
    filter.addAction(ACTION_DELIVERED);
    ContextCompat.registerReceiver(getContext(), resultReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
  }

  @Override
  protected void handleOnDestroy() {
    try { getContext().unregisterReceiver(resultReceiver); } catch (Exception ignored) {}
  }

  @PluginMethod
  public void capabilities(PluginCall call) {
    Context ctx = getContext();
    PackageManager pm = ctx.getPackageManager();
    TelephonyManager tm = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
    boolean hasTelephony = pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
    boolean simReady = tm != null && tm.getSimState() == TelephonyManager.SIM_STATE_READY;
    boolean cellService = false;
    try { cellService = tm != null && tm.getServiceState() != null && tm.getServiceState().getState() == android.telephony.ServiceState.STATE_IN_SERVICE; } catch (SecurityException ignored) {}

    boolean internet = false;
    ConnectivityManager cm = (ConnectivityManager) ctx.getSystemService(Context.CONNECTIVITY_SERVICE);
    if (cm != null) {
      // A failed check must never crash the app during an SOS; report offline instead
      try {
        Network n = cm.getActiveNetwork();
        NetworkCapabilities nc = n != null ? cm.getNetworkCapabilities(n) : null;
        internet = nc != null && nc.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
      } catch (RuntimeException ignored) {}
    }

    Intent composer = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:"));
    JSObject r = new JSObject();
    r.put("internet", internet);
    r.put("telephony", hasTelephony);
    r.put("simReady", simReady);
    r.put("cellService", cellService);
    r.put("directSend", hasTelephony && simReady);
    r.put("composer", composer.resolveActivity(pm) != null);
    r.put("smsPermission", getPermissionState("sms") == PermissionState.GRANTED);
    call.resolve(r);
  }

  @PluginMethod
  public void requestSmsPermission(PluginCall call) {
    if (getPermissionState("sms") == PermissionState.GRANTED) {
      JSObject r = new JSObject();
      r.put("granted", true);
      call.resolve(r);
      return;
    }
    requestPermissionForAlias("sms", call, "smsPermissionCallback");
  }

  @PermissionCallback
  private void smsPermissionCallback(PluginCall call) {
    JSObject r = new JSObject();
    r.put("granted", getPermissionState("sms") == PermissionState.GRANTED);
    call.resolve(r);
  }

  @PluginMethod
  public void send(PluginCall call) {
    String eventId = call.getString("eventId", "");
    String message = call.getString("message", "");
    JSArray numbers = call.getArray("numbers", new JSArray());
    if (getPermissionState("sms") != PermissionState.GRANTED) {
      call.reject("SMS permission not granted", "PERMISSION_DENIED");
      return;
    }
    SmsManager sms = Build.VERSION.SDK_INT >= 31 ? getContext().getSystemService(SmsManager.class) : SmsManager.getDefault();
    JSArray attempted = new JSArray();
    JSArray failed = new JSArray();
    int reqCode = (int) (System.currentTimeMillis() & 0xffff);
    for (int i = 0; i < numbers.length(); i++) {
      String number = numbers.optString(i, "");
      if (number.isEmpty()) continue;
      try {
        ArrayList<String> parts = sms.divideMessage(message);
        ArrayList<PendingIntent> sentIntents = new ArrayList<>();
        ArrayList<PendingIntent> deliveredIntents = new ArrayList<>();
        for (int p = 0; p < parts.size(); p++) {
          // only the last part reports, so one status event per recipient
          boolean last = p == parts.size() - 1;
          sentIntents.add(last ? pending(ACTION_SENT, eventId, number, reqCode++) : null);
          deliveredIntents.add(last ? pending(ACTION_DELIVERED, eventId, number, reqCode++) : null);
        }
        sms.sendMultipartTextMessage(number, null, parts, sentIntents, deliveredIntents);
        attempted.put(number);
      } catch (Exception e) {
        failed.put(number);
      }
    }
    JSObject r = new JSObject();
    r.put("attempted", attempted);
    r.put("failed", failed);
    call.resolve(r);
  }

  @PluginMethod
  public void openComposer(PluginCall call) {
    JSArray numbers = call.getArray("numbers", new JSArray());
    StringBuilder to = new StringBuilder();
    for (int i = 0; i < numbers.length(); i++) {
      if (to.length() > 0) to.append(';');
      to.append(numbers.optString(i, ""));
    }
    Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + Uri.encode(to.toString())));
    intent.putExtra("sms_body", call.getString("message", ""));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    JSObject r = new JSObject();
    try {
      getContext().startActivity(intent);
      r.put("opened", true);
    } catch (Exception e) {
      r.put("opened", false);
    }
    call.resolve(r);
  }

  private PendingIntent pending(String action, String eventId, String number, int code) {
    Intent i = new Intent(action).setPackage(getContext().getPackageName());
    i.putExtra("eventId", eventId);
    i.putExtra("number", number);
    return PendingIntent.getBroadcast(getContext(), code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
  }
}
