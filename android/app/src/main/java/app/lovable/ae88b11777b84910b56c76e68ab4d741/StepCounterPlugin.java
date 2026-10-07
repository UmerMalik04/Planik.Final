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
import android.util.Log;

import androidx.activity.result.ActivityResultLauncher;
import androidx.health.connect.client.HealthConnectClient;
import androidx.health.connect.client.PermissionController;
import androidx.health.connect.client.permission.HealthPermission;
import androidx.health.connect.client.records.StepsRecord;
import androidx.health.connect.client.request.AggregateRequest;
import androidx.health.connect.client.aggregate.AggregationResult;
import androidx.health.connect.client.time.TimeRangeFilter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Set;
import java.util.HashSet;

import kotlinx.coroutines.Dispatchers;
import kotlinx.coroutines.GlobalScope;

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

    private static final String TAG = "StepCounterPlugin";

    // Sensor fallback
    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean isSensorRegistered = false;
    private float totalStepsSinceReboot = 0f;
    private float initialStepCount = 0f;

    // Health Connect
    private HealthConnectClient healthConnectClient;
    private boolean healthConnectAvailable = false;

    // Persistence keys
    private static final String PREFS_NAME = "step_counter_prefs";
    private static final String INITIAL_STEPS_KEY = "initial_steps_key";
    private static final String LAST_SAVE_DATE_KEY = "last_save_date_key";

    // Health Connect permission set
    private final Set<String> HEALTH_PERMISSIONS = Set.of(
        HealthPermission.getReadPermission(StepsRecord.class)
    );

    // Activity result launcher for Health Connect permissions
    private ActivityResultLauncher<Set<String>> permissionLauncher;
    private PluginCall pendingPermissionCall;

    // ─────────────────────────── Lifecycle ───────────────────────────

    @Override
    public void load() {
        super.load();

        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);

        initHealthConnect();
        loadData();
        checkAndResetIfNewDay();

        // Register the Health Connect permission launcher
        try {
            permissionLauncher = getActivity().registerForActivityResult(
                PermissionController.createRequestPermissionResultContract(),
                grantedPermissions -> {
                    boolean allGranted = grantedPermissions.containsAll(HEALTH_PERMISSIONS);
                    Log.d(TAG, "Health Connect permissions result: " + allGranted);

                    if (pendingPermissionCall != null) {
                        JSObject result = new JSObject();
                        result.put("granted", allGranted);
                        pendingPermissionCall.resolve(result);
                        pendingPermissionCall = null;
                    }

                    if (allGranted) {
                        registerStepSensor(); // also start sensor as backup
                    }
                }
            );
        } catch (Exception e) {
            Log.e(TAG, "Could not register permission launcher: " + e.getMessage());
        }
    }

    private void initHealthConnect() {
        try {
            int availability = HealthConnectClient.getSdkStatus(getContext());
            if (availability == HealthConnectClient.SDK_AVAILABLE) {
                healthConnectClient = HealthConnectClient.getOrCreate(getContext());
                healthConnectAvailable = true;
                Log.d(TAG, "Health Connect available and initialised");
            } else {
                Log.d(TAG, "Health Connect not available (status=" + availability + "), using sensor fallback");
                healthConnectAvailable = false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error initialising Health Connect: " + e.getMessage());
            healthConnectAvailable = false;
        }
    }

    // ──────────────────────── Permission methods ────────────────────────

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (healthConnectAvailable && permissionLauncher != null) {
            // Check if already granted
            new Thread(() -> {
                try {
                    Set<String> granted = kotlinx.coroutines.future.FutureKt
                        .future(GlobalScope.INSTANCE, Dispatchers.getIO(), (scope, cont) ->
                            healthConnectClient.getPermissionController()
                                .getGrantedPermissions(cont))
                        .get();

                    if (granted.containsAll(HEALTH_PERMISSIONS)) {
                        Log.d(TAG, "Health Connect permissions already granted");
                        JSObject result = new JSObject();
                        result.put("granted", true);
                        call.resolve(result);
                        registerStepSensor();
                    } else {
                        // Launch the system permission dialog on the main thread
                        getActivity().runOnUiThread(() -> {
                            pendingPermissionCall = call;
                            permissionLauncher.launch(HEALTH_PERMISSIONS);
                        });
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error checking Health Connect permissions: " + e.getMessage());
                    requestSensorPermissions(call);
                }
            }).start();
        } else {
            requestSensorPermissions(call);
        }
    }

    private void requestSensorPermissions(PluginCall call) {
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
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            registerStepSensor();
        }
    }

    @PluginMethod
    public void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = getPermissionState("activityRecognition") == com.getcapacitor.PermissionState.GRANTED;
        result.put("granted", granted);
        if (granted) registerStepSensor();
        call.resolve(result);
    }

    // ────────────────────────── Step queries ──────────────────────────

    @PluginMethod
    public void getStepsToday(PluginCall call) {
        if (healthConnectAvailable) {
            getStepsTodayFromHealthConnect(call);
        } else {
            getStepsTodayFromSensor(call);
        }
    }

    private void getStepsTodayFromHealthConnect(PluginCall call) {
        try {
            LocalDate today = LocalDate.now();
            Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
            Instant now = Instant.now();

            TimeRangeFilter timeRange = TimeRangeFilter.between(startOfDay, now);
            AggregateRequest request = new AggregateRequest(
                Set.of(StepsRecord.COUNT_TOTAL), timeRange, Set.of()
            );

            new Thread(() -> {
                try {
                    AggregationResult result = kotlinx.coroutines.future.FutureKt
                        .future(GlobalScope.INSTANCE, Dispatchers.getIO(), (scope, cont) ->
                            healthConnectClient.aggregate(request, cont))
                        .get();

                    Long steps = result.get(StepsRecord.COUNT_TOTAL);
                    int stepCount = steps != null ? steps.intValue() : 0;
                    Log.d(TAG, "Health Connect today steps: " + stepCount);

                    JSObject jsResult = new JSObject();
                    jsResult.put("steps", stepCount);
                    call.resolve(jsResult);
                } catch (Exception e) {
                    Log.e(TAG, "Health Connect today query failed, falling back to sensor: " + e.getMessage());
                    getStepsTodayFromSensor(call);
                }
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "Error setting up Health Connect query: " + e.getMessage());
            getStepsTodayFromSensor(call);
        }
    }

    private void getStepsTodayFromSensor(PluginCall call) {
        if (stepSensor == null) {
            JSObject result = new JSObject();
            result.put("steps", 0);
            call.resolve(result);
            return;
        }
        registerStepSensor();
        float currentSteps = Math.max(0, totalStepsSinceReboot - initialStepCount);
        JSObject result = new JSObject();
        result.put("steps", (int) currentSteps);
        call.resolve(result);
    }

    @PluginMethod
    public void getStepsForDateRange(PluginCall call) {
        String startDateStr = call.getString("startDate");
        String endDateStr = call.getString("endDate");

        if (startDateStr == null || endDateStr == null) {
            call.reject("Start date and end date are required");
            return;
        }

        if (healthConnectAvailable) {
            getStepsForDateRangeFromHealthConnect(call, startDateStr, endDateStr);
        } else {
            getStepsForDateRangeFromSensor(call);
        }
    }

    private void getStepsForDateRangeFromHealthConnect(PluginCall call, String startDateStr, String endDateStr) {
        try {
            Instant startInstant = Instant.parse(startDateStr);
            Instant endInstant = Instant.parse(endDateStr);

            TimeRangeFilter timeRange = TimeRangeFilter.between(startInstant, endInstant);
            AggregateRequest request = new AggregateRequest(
                Set.of(StepsRecord.COUNT_TOTAL), timeRange, Set.of()
            );

            new Thread(() -> {
                try {
                    AggregationResult result = kotlinx.coroutines.future.FutureKt
                        .future(GlobalScope.INSTANCE, Dispatchers.getIO(), (scope, cont) ->
                            healthConnectClient.aggregate(request, cont))
                        .get();

                    Long steps = result.get(StepsRecord.COUNT_TOTAL);
                    int stepCount = steps != null ? steps.intValue() : 0;
                    Log.d(TAG, "Health Connect range steps: " + stepCount +
                          " (" + startDateStr + " → " + endDateStr + ")");

                    JSObject jsResult = new JSObject();
                    jsResult.put("steps", stepCount);
                    call.resolve(jsResult);
                } catch (Exception e) {
                    Log.e(TAG, "Health Connect range query failed: " + e.getMessage());
                    getStepsForDateRangeFromSensor(call);
                }
            }).start();
        } catch (Exception e) {
            Log.e(TAG, "Error parsing dates for Health Connect: " + e.getMessage());
            getStepsForDateRangeFromSensor(call);
        }
    }

    private void getStepsForDateRangeFromSensor(PluginCall call) {
        float currentSteps = Math.max(0, totalStepsSinceReboot - initialStepCount);
        JSObject result = new JSObject();
        result.put("steps", (int) currentSteps);
        call.resolve(result);
    }

    // ──────────────────── Sensor callbacks (fallback) ────────────────────

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            totalStepsSinceReboot = event.values[0];
            if (initialStepCount == 0f) {
                initialStepCount = totalStepsSinceReboot;
                saveData();
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    // ─────────────────── Persistence (sensor fallback) ───────────────────

    private void loadData() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        initialStepCount = prefs.getFloat(INITIAL_STEPS_KEY, 0f);
    }

    private void saveData() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putFloat(INITIAL_STEPS_KEY, initialStepCount)
            .putString(LAST_SAVE_DATE_KEY, getCurrentDate())
            .apply();
    }

    private void checkAndResetIfNewDay() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastSaveDate = prefs.getString(LAST_SAVE_DATE_KEY, "");
        String currentDate = getCurrentDate();
        if (!lastSaveDate.equals(currentDate)) {
            initialStepCount = totalStepsSinceReboot;
            saveData();
        }
    }

    private String getCurrentDate() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.YEAR) + "-" +
               String.format("%02d", c.get(Calendar.MONTH) + 1) + "-" +
               String.format("%02d", c.get(Calendar.DAY_OF_MONTH));
    }

    private void registerStepSensor() {
        if (stepSensor != null && !isSensorRegistered) {
            sensorManager.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_UI);
            isSensorRegistered = true;
        }
    }

    // ──────────────────────── Capacitor lifecycle ────────────────────────

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        registerStepSensor();
        checkAndResetIfNewDay();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (isSensorRegistered) {
            sensorManager.unregisterListener(this);
            isSensorRegistered = false;
        }
    }
}
