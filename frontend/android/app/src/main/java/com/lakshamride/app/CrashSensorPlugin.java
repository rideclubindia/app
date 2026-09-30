package com.lakshamride.app;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.List;

/**
 * Sensor Abstraction Layer (Android) — Crash Detection & Emergency Response
 * Architecture.md §1/§9. Samples the raw accelerometer (gravity included; the
 * TS SignalProcessor in frontend/src/lib/crashDetection does gravity
 * compensation, not this layer — see that architecture doc's §9 rationale for
 * why iOS's CoreMotion differs but Android's raw SensorManager doesn't) and
 * the gyroscope at the fastest rate the device allows, batching samples in
 * native code and flushing them to JS on a fixed interval so a 100-200Hz
 * stream doesn't turn into one bridge crossing per sample.
 *
 * Registered manually in MainActivity (not auto-discovered) since this is a
 * project-local plugin, not a published Capacitor plugin package.
 */
@CapacitorPlugin(name = "CrashSensor")
public class CrashSensorPlugin extends Plugin implements SensorEventListener {

  private static final long FLUSH_INTERVAL_MS = 50; // batches, not per-sample bridge calls
  private static final int SAMPLING_PERIOD_US = 10_000;
  // Sensor hub batches readings for up to 100 ms so the CPU can sleep between deliveries
  private static final int MAX_REPORT_LATENCY_US = 100_000;

  private SensorManager sensorManager;
  private Sensor accelerometer;
  private Sensor gyroscope;
  private final Handler flushHandler = new Handler(Looper.getMainLooper());
  private final List<double[]> pendingAccel = new ArrayList<>();
  private final List<double[]> pendingGyro = new ArrayList<>();
  private boolean running = false;

  // Achieved-rate measurement — reported back per the normalized event's
  // samplingRate field, never assumed to be the requested 120Hz.
  private int samplesInCurrentSecond = 0;
  private long currentSecondBucket = 0;
  private int lastAchievedRateHz = 0;

  private final Runnable flushRunnable =
      new Runnable() {
        @Override
        public void run() {
          flushBatch();
          if (running) {
            flushHandler.postDelayed(this, FLUSH_INTERVAL_MS);
          }
        }
      };

  @Override
  public void load() {
    sensorManager = (SensorManager) getContext().getSystemService(android.content.Context.SENSOR_SERVICE);
    if (sensorManager != null) {
      accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
      gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
    }
  }

  @PluginMethod
  public void start(PluginCall call) {
    if (sensorManager == null || accelerometer == null || gyroscope == null) {
      call.reject("Accelerometer or gyroscope not available on this device");
      return;
    }
    if (!running) {
      running = true;
      // 100Hz (10ms) is enough for impact detection and avoids the 200Hz+ FASTEST rate's battery cost on long rides
      sensorManager.registerListener(this, accelerometer, SAMPLING_PERIOD_US, MAX_REPORT_LATENCY_US);
      sensorManager.registerListener(this, gyroscope, SAMPLING_PERIOD_US, MAX_REPORT_LATENCY_US);
      flushHandler.postDelayed(flushRunnable, FLUSH_INTERVAL_MS);
    }
    call.resolve();
  }

  @PluginMethod
  public void stop(PluginCall call) {
    if (running) {
      running = false;
      sensorManager.unregisterListener(this);
      flushHandler.removeCallbacks(flushRunnable);
      flushBatch();
    }
    call.resolve();
  }

  @PluginMethod
  public void getAchievedSamplingRate(PluginCall call) {
    JSObject ret = new JSObject();
    ret.put("samplingRate", lastAchievedRateHz);
    call.resolve(ret);
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    // When the reading was taken, not when a batch was delivered
    long tMs = System.currentTimeMillis() - (SystemClock.elapsedRealtimeNanos() - event.timestamp) / 1_000_000L;
    trackAchievedRate(tMs);

    double[] sample = new double[] { tMs, event.values[0], event.values[1], event.values[2] };
    if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
      synchronized (pendingAccel) {
        pendingAccel.add(sample);
      }
    } else if (event.sensor.getType() == Sensor.TYPE_GYROSCOPE) {
      // Android gyroscope reports rad/s; normalize to deg/s to match the
      // architecture's normalized event contract used throughout the TS engine.
      sample[1] = Math.toDegrees(sample[1]);
      sample[2] = Math.toDegrees(sample[2]);
      sample[3] = Math.toDegrees(sample[3]);
      synchronized (pendingGyro) {
        pendingGyro.add(sample);
      }
    }
  }

  @Override
  public void onAccuracyChanged(Sensor sensor, int accuracy) {
    // Not surfaced yet — Phase 1's engine doesn't consume per-sensor accuracy;
    // revisit if false-positive tuning (Architecture.md §12) needs it later.
  }

  private void trackAchievedRate(long tMs) {
    long secondBucket = tMs / 1000;
    if (secondBucket != currentSecondBucket) {
      lastAchievedRateHz = samplesInCurrentSecond;
      samplesInCurrentSecond = 0;
      currentSecondBucket = secondBucket;
    }
    samplesInCurrentSecond++;
  }

  /**
   * Pairs the most recent accel/gyro readings per timestamp bucket into the
   * normalized {@code SensorSample} shape and emits one batched event — this
   * is a nearest-match pairing (accel and gyro fire on independent hardware
   * clocks), acceptable for Phase 1/2 since the TS engine only needs
   * millisecond-scale alignment, not sub-sample precision.
   */
  private void flushBatch() {
    List<double[]> accelBatch;
    List<double[]> gyroBatch;
    synchronized (pendingAccel) {
      accelBatch = new ArrayList<>(pendingAccel);
      pendingAccel.clear();
    }
    synchronized (pendingGyro) {
      gyroBatch = new ArrayList<>(pendingGyro);
      pendingGyro.clear();
    }
    if (accelBatch.isEmpty() && gyroBatch.isEmpty()) {
      return;
    }

    JSArray samples = new JSArray();
    int gyroIdx = 0;
    for (double[] a : accelBatch) {
      // advance the gyro cursor to the closest-in-time reading at or before this accel sample
      while (gyroIdx + 1 < gyroBatch.size() && gyroBatch.get(gyroIdx + 1)[0] <= a[0]) {
        gyroIdx++;
      }
      double[] g = gyroBatch.isEmpty() ? new double[] { a[0], 0, 0, 0 } : gyroBatch.get(Math.min(gyroIdx, gyroBatch.size() - 1));

      JSObject accelObj = new JSObject();
      accelObj.put("x", a[1]);
      accelObj.put("y", a[2]);
      accelObj.put("z", a[3]);

      JSObject gyroObj = new JSObject();
      gyroObj.put("x", g[1]);
      gyroObj.put("y", g[2]);
      gyroObj.put("z", g[3]);

      JSObject sample = new JSObject();
      sample.put("t", a[0]);
      sample.put("accelerometer", accelObj);
      sample.put("gyroscope", gyroObj);
      sample.put("samplingRate", lastAchievedRateHz);
      samples.put(sample);
    }

    JSObject payload = new JSObject();
    payload.put("samples", samples);
    notifyListeners("sampleBatch", payload);
  }

  @Override
  protected void handleOnDestroy() {
    if (running) {
      running = false;
      sensorManager.unregisterListener(this);
      flushHandler.removeCallbacks(flushRunnable);
    }
    super.handleOnDestroy();
  }
}
