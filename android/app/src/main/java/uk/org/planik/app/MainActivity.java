package uk.org.planik.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Plugins that live in the app module must be registered before the bridge starts
        registerPlugin(StepCounterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
