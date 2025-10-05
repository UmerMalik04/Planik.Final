package app.lovable.ae88b11777b84910b56c76e68ab4d741;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.util.Calendar;

@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(
            alias = "activityRecognition",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {
    
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean isSensorRegistered = false;
    
    // Step counting variables
    private float totalStepsSinceReboot = 0f;
    private float initialStepCount = 0f;
    
    // SharedPreferences
    private static final String PREFS_NAME = "step_counter_prefs";
    private static final String INITIAL_STEPS_KEY = "initial_steps_key";
    private static final String LAST_SAVE_DATE_KEY = "last_save_date_key";
    
    @Override
    public void load() {
        super.load();
        
        // Get the SensorManager and Step Counter Sensor
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        // Load saved data
        loadData();
        
        // Check if it's a new day and reset if needed
        checkAndResetIfNewDay();
    }
    
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (getPermissionState("activityRecognition") != com.getcapacitor.PermissionState.GRANTED) {
                requestPermissionForAlias("activityRecognition", call, "permissionCallback");
            } else {
                JSObject result = new JSObject();
                result.put("granted", true);
                call.resolve(result);
                registerStepSensor();
            }
        } else {
            // Permission not required for Android < 10
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            registerStepSensor();
        }
    }
    
    @PluginMethod
    public void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        if (getPermissionState("activityRecognition") == com.getcapacitor.PermissionState.GRANTED) {
            result.put("granted", true);
            registerStepSensor();
        } else {
            result.put("granted", false);
        }
        call.resolve(result);
    }
    
    @PluginMethod
    public void getStepsToday(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step Counter sensor not available on this device");
            return;
        }
        
        // Ensure sensor is registered
        registerStepSensor();
        
        // Calculate current steps
        float currentSteps = Math.max(0, totalStepsSinceReboot - initialStepCount);
        
        JSObject result = new JSObject();
        result.put("steps", (int) currentSteps);
        call.resolve(result);
    }
    
    @PluginMethod
    public void getStepsForDateRange(PluginCall call) {
        // Note: Android's TYPE_STEP_COUNTER only provides cumulative steps since reboot
        // For historical data, you would need to use Google Fit API or similar
        // For now, we'll return today's steps if the date range includes today
        
        String startDateStr = call.getString("startDate");
        String endDateStr = call.getString("endDate");
        
        if (startDateStr == null || endDateStr == null) {
            call.reject("Start date and end date are required");
            return;
        }
        
        // For simplicity, return today's steps
        // In a production app, integrate with Google Fit or Health Connect API
        float currentSteps = Math.max(0, totalStepsSinceReboot - initialStepCount);
        
        JSObject result = new JSObject();
        result.put("steps", (int) currentSteps);
        call.resolve(result);
    }
    
    // --- Sensor Event Handling ---
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            // Get total steps since device reboot
            totalStepsSinceReboot = event.values[0];
            
            // If this is the first reading, save it as the starting point
            if (initialStepCount == 0f) {
                initialStepCount = totalStepsSinceReboot;
                saveData();
            }
        }
    }
    
    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not used for step counting
    }
    
    // --- Data Persistence ---
    
    private void loadData() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        initialStepCount = prefs.getFloat(INITIAL_STEPS_KEY, 0f);
    }
    
    private void saveData() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putFloat(INITIAL_STEPS_KEY, initialStepCount);
        editor.putString(LAST_SAVE_DATE_KEY, getCurrentDate());
        editor.apply();
    }
    
    private void checkAndResetIfNewDay() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastSaveDate = prefs.getString(LAST_SAVE_DATE_KEY, "");
        String currentDate = getCurrentDate();
        
        // If it's a new day, reset the counter
        if (!lastSaveDate.equals(currentDate)) {
            initialStepCount = totalStepsSinceReboot;
            saveData();
        }
    }
    
    private String getCurrentDate() {
        Calendar calendar = Calendar.getInstance();
        return calendar.get(Calendar.YEAR) + "-" + 
               (calendar.get(Calendar.MONTH) + 1) + "-" + 
               calendar.get(Calendar.DAY_OF_MONTH);
    }
    
    private void registerStepSensor() {
        if (stepSensor != null && !isSensorRegistered) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI);
            isSensorRegistered = true;
        }
    }
    
    private void unregisterStepSensor() {
        if (isSensorRegistered) {
            sensorManager.unregisterListener(this);
            isSensorRegistered = false;
        }
    }
    
    @Override
    protected void handleOnPause() {
        super.handleOnPause();
        // Keep sensor registered even when app is paused to continue counting
        // For better battery optimization, you might want to unregister and use a service
    }
    
    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        registerStepSensor();
        checkAndResetIfNewDay();
    }
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        unregisterStepSensor();
    }
}
