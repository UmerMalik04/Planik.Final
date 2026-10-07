package app.lovable.ae88b11777b84910b56c76e68ab4d741;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before calling super.onCreate
        registerPlugin(StepCounterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
