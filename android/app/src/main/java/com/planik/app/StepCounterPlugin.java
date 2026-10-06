package com.planik.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Counts today's steps using the hardware TYPE_STEP_COUNTER sensor.
 *
 * The sensor reports a running total since the last reboot, so we store the
 * total seen at the start of the day (the baseline) and subtract it. Steps
 * counted before a reboot are kept in a separate offset because the sensor
 * total drops back to zero when the device restarts.
 *
 * The sensor has no history, so getStepsForDateRange only answers for today;
 * earlier days come from the step_history table on the JavaScript side.
 */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(alias = "activityRecognition", strings = { Manifest.permission.ACTIVITY_RECOGNITION })
    }
)
public class StepCounterPlugin extends Plugin implements SensorEventListener {

    private static final String PREFS_NAME = "step_counter_prefs";
    private static final String KEY_DATE = "date";
    private static final String KEY_BASELINE = "baseline";
    private static final String KEY_OFFSET = "offset";
    private static final String KEY_LAST_TOTAL = "last_total";

    // How long getStepsToday waits for the sensor's first reading
    private static final long FIRST_READING_TIMEOUT_MS = 2000;

    private SensorManager sensorManager;
    private Sensor stepSensor;
    private boolean isSensorRegistered = false;

    private String date;        // day the counters below belong to (yyyy-MM-dd, local time)
    private float baseline;     // sensor total at the start of the day, or after the last reboot
    private float offset;       // steps counted today before the last reboot
    private float lastTotal;    // most recent sensor total, -1 if none yet
    private boolean hasReadingThisSession = false;

    private final List<PluginCall> pendingCalls = new ArrayList<>();
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void load() {
        super.load();
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        stepSensor = sensorManager != null ? sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) : null;
        loadState();
    }

    @PluginMethod
    @Override
    public void requestPermissions(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device");
            return;
        }
        if (hasActivityPermission()) {
            registerStepSensor();
            resolveGranted(call, true);
        } else {
            requestPermissionForAlias("activityRecognition", call, "activityPermissionCallback");
        }
    }

    @PermissionCallback
    private void activityPermissionCallback(PluginCall call) {
        boolean granted = hasActivityPermission();
        if (granted) {
            registerStepSensor();
        }
        resolveGranted(call, granted);
    }

    @PluginMethod
    public void getStepsToday(PluginCall call) {
        if (stepSensor == null) {
            call.reject("Step counter sensor not available on this device");
            return;
        }
        if (!hasActivityPermission()) {
            call.reject("Activity recognition permission not granted");
            return;
        }

        registerStepSensor();

        if (hasReadingThisSession) {
            resolveSteps(call);
            return;
        }

        // The sensor delivers its first value shortly after registration;
        // answer then, or after a timeout with whatever is stored.
        call.setKeepAlive(true);
        pendingCalls.add(call);
        handler.postDelayed(() -> {
            if (pendingCalls.remove(call)) {
                call.setKeepAlive(false);
                resolveSteps(call);
            }
        }, FIRST_READING_TIMEOUT_MS);
    }

    @PluginMethod
    public void getStepsForDateRange(PluginCall call) {
        String startDateStr = call.getString("startDate");
        String endDateStr = call.getString("endDate");
        if (startDateStr == null || endDateStr == null) {
            call.reject("Start date and end date are required");
            return;
        }

        Date start;
        Date end;
        try {
            start = parseIsoDate(startDateStr);
            end = parseIsoDate(endDateStr);
        } catch (ParseException e) {
            call.reject("Invalid date format. Use ISO 8601 (Date.toISOString())");
            return;
        }

        Date now = new Date();
        if (now.before(start) || now.after(end)) {
            call.reject("Step history is not available on Android for past dates");
            return;
        }

        getStepsToday(call);
    }

    // --- Sensor ---

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() != Sensor.TYPE_STEP_COUNTER) {
            return;
        }
        float total = event.values[0];
        String today = currentDate();

        if (!today.equals(date)) {
            // First reading of a new day. If the previous reading was from
            // yesterday, steps since then most likely happened this morning.
            boolean continuesFromYesterday = yesterday().equals(date) && lastTotal >= 0 && total >= lastTotal;
            date = today;
            baseline = continuesFromYesterday ? lastTotal : total;
            offset = 0;
        } else if (lastTotal < 0) {
            // First reading ever for today with no previous total
            baseline = total;
        } else if (total < lastTotal) {
            // The device rebooted and the sensor total restarted from zero
            offset += Math.max(0, lastTotal - baseline);
            baseline = 0;
        }

        lastTotal = total;
        hasReadingThisSession = true;
        saveState();

        for (PluginCall call : pendingCalls) {
            call.setKeepAlive(false);
            resolveSteps(call);
        }
        pendingCalls.clear();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not used for step counting
    }

    private void registerStepSensor() {
        if (stepSensor != null && !isSensorRegistered && hasActivityPermission()) {
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
    protected void handleOnResume() {
        super.handleOnResume();
        registerStepSensor();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        unregisterStepSensor();
        handler.removeCallbacksAndMessages(null);
    }

    // --- Helpers ---

    private int stepsToday() {
        if (!currentDate().equals(date) || lastTotal < 0) {
            return 0;
        }
        return (int) Math.max(0, offset + lastTotal - baseline);
    }

    private void resolveSteps(PluginCall call) {
        JSObject result = new JSObject();
        result.put("steps", stepsToday());
        call.resolve(result);
    }

    private void resolveGranted(PluginCall call, boolean granted) {
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    private boolean hasActivityPermission() {
        // ACTIVITY_RECOGNITION is a runtime permission only from Android 10
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
            || getPermissionState("activityRecognition") == PermissionState.GRANTED;
    }

    private void loadState() {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        date = prefs.getString(KEY_DATE, "");
        baseline = prefs.getFloat(KEY_BASELINE, 0f);
        offset = prefs.getFloat(KEY_OFFSET, 0f);
        lastTotal = prefs.getFloat(KEY_LAST_TOTAL, -1f);
    }

    private void saveState() {
        getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_DATE, date)
            .putFloat(KEY_BASELINE, baseline)
            .putFloat(KEY_OFFSET, offset)
            .putFloat(KEY_LAST_TOTAL, lastTotal)
            .apply();
    }

    private static String formatDate(Calendar calendar) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        return format.format(calendar.getTime());
    }

    private static String currentDate() {
        return formatDate(Calendar.getInstance());
    }

    private static String yesterday() {
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.DAY_OF_YEAR, -1);
        return formatDate(calendar);
    }

    private static Date parseIsoDate(String value) throws ParseException {
        // Matches JavaScript's Date.toISOString(), e.g. 2026-10-06T00:00:00.000Z
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return format.parse(value);
    }
}
