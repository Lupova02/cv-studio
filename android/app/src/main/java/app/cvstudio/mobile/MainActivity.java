package app.cvstudio.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // App-eigene Plugins vor dem Start der Bridge anmelden.
    registerPlugin(CvPrintPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
