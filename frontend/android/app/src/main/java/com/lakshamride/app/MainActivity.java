package com.lakshamride.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(CrashSensorPlugin.class);
    registerPlugin(SosSmsPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
