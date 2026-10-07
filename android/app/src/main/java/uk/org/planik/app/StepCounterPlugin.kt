package uk.org.planik.app

import android.Manifest
import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateGroupByPeriodRequest
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId

/**
 * Step counts for the StepCounter JavaScript plugin.
 *
 * Health Connect is the main source: it has history, so any date range works.
 * Phones without Health Connect fall back to the hardware step counter
 * sensor, which only knows today's steps; past dates are rejected there so
 * HealthService falls back to the history saved in Supabase instead of
 * storing today's count against every past day.
 */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = [
        Permission(alias = "activityRecognition", strings = [Manifest.permission.ACTIVITY_RECOGNITION])
    ]
)
class StepCounterPlugin : Plugin(), SensorEventListener {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val handler = Handler(Looper.getMainLooper())

    private var healthConnect: HealthConnectClient? = null
    private val healthPermissions = setOf(HealthPermission.getReadPermission(StepsRecord::class))
    private var healthPermissionLauncher: ActivityResultLauncher<Set<String>>? = null
    private var pendingHealthPermissionCall: PluginCall? = null

    private var sensorManager: SensorManager? = null
    private var stepSensor: Sensor? = null
    private var isSensorRegistered = false
    private val sensorCounter = SensorStepCounter()
    private val pendingSensorCalls = mutableListOf<PluginCall>()

    override fun load() {
        super.load()

        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            healthConnect = HealthConnectClient.getOrCreate(context)
            healthPermissionLauncher = activity.registerForActivityResult(
                PermissionController.createRequestPermissionResultContract()
            ) { granted -> onHealthPermissionResult(granted.containsAll(healthPermissions)) }
        } else {
            Log.d(TAG, "Health Connect not available, using the step counter sensor")
        }

        sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager?
        stepSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        sensorCounter.load(context)
    }

    // --- Permissions ---

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        val client = healthConnect
        val launcher = healthPermissionLauncher
        if (client == null || launcher == null) {
            requestSensorPermission(call)
            return
        }

        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                if (granted.containsAll(healthPermissions)) {
                    resolveGranted(call, true)
                } else {
                    pendingHealthPermissionCall = call
                    launcher.launch(healthPermissions)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Health Connect permission check failed", e)
                requestSensorPermission(call)
            }
        }
    }

    private fun onHealthPermissionResult(granted: Boolean) {
        val call = pendingHealthPermissionCall ?: return
        pendingHealthPermissionCall = null
        if (granted) {
            resolveGranted(call, true)
        } else {
            // Health Connect declined; the sensor can still count today's steps
            requestSensorPermission(call)
        }
    }

    private fun requestSensorPermission(call: PluginCall) {
        if (stepSensor == null) {
            resolveGranted(call, false)
        } else if (hasActivityPermission()) {
            registerStepSensor()
            resolveGranted(call, true)
        } else {
            requestPermissionForAlias("activityRecognition", call, "activityPermissionCallback")
        }
    }

    @PermissionCallback
    private fun activityPermissionCallback(call: PluginCall) {
        val granted = hasActivityPermission()
        if (granted) registerStepSensor()
        resolveGranted(call, granted)
    }

    // --- Step queries ---

    @PluginMethod
    fun getStepsToday(call: PluginCall) {
        val startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant()
        queryHealthConnect(call, startOfDay, Instant.now()) { getStepsTodayFromSensor(call) }
    }

    @PluginMethod
    fun getStepsForDateRange(call: PluginCall) {
        val start: Instant
        val end: Instant
        try {
            start = Instant.parse(call.getString("startDate") ?: return call.reject("startDate is required"))
            end = Instant.parse(call.getString("endDate") ?: return call.reject("endDate is required"))
        } catch (e: Exception) {
            call.reject("Invalid date. Use ISO 8601, e.g. Date.toISOString()")
            return
        }

        queryHealthConnect(call, start, end) {
            val now = Instant.now()
            if (now.isBefore(start) || now.isAfter(end)) {
                call.reject("Step history for past days needs Health Connect")
            } else {
                getStepsTodayFromSensor(call)
            }
        }
    }

    /** Daily totals for a calendar month in one Health Connect request. */
    @PluginMethod
    fun getStepsForMonth(call: PluginCall) {
        val client = healthConnect ?: return call.reject("Step history needs Health Connect")
        val year = call.getInt("year") ?: return call.reject("year is required")
        val month = call.getInt("month") ?: return call.reject("month is required")

        val firstDay = LocalDate.of(year, month, 1)
        val lastDay = minOf(firstDay.plusMonths(1).minusDays(1), LocalDate.now())
        if (lastDay.isBefore(firstDay)) {
            call.resolve(JSObject().put("days", JSArray()))
            return
        }

        scope.launch {
            try {
                val groups = client.aggregateGroupByPeriod(
                    AggregateGroupByPeriodRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(
                            firstDay.atStartOfDay(),
                            lastDay.plusDays(1).atStartOfDay()
                        ),
                        timeRangeSlicer = Period.ofDays(1)
                    )
                )
                val days = JSArray()
                for (group in groups) {
                    days.put(
                        JSObject()
                            .put("date", group.startTime.toLocalDate().toString())
                            .put("steps", (group.result[StepsRecord.COUNT_TOTAL] ?: 0L).toInt())
                    )
                }
                call.resolve(JSObject().put("days", days))
            } catch (e: Exception) {
                Log.e(TAG, "Health Connect month query failed", e)
                call.reject("Could not read steps from Health Connect", e)
            }
        }
    }

    private fun queryHealthConnect(call: PluginCall, start: Instant, end: Instant, fallback: () -> Unit) {
        val client = healthConnect ?: return fallback()
        scope.launch {
            try {
                val result = client.aggregate(
                    AggregateRequest(
                        metrics = setOf(StepsRecord.COUNT_TOTAL),
                        timeRangeFilter = TimeRangeFilter.between(start, end)
                    )
                )
                val steps = result[StepsRecord.COUNT_TOTAL] ?: 0L
                call.resolve(JSObject().put("steps", steps.toInt()))
            } catch (e: Exception) {
                // Usually SecurityException: Health Connect permission not granted
                Log.w(TAG, "Health Connect query failed, trying the sensor", e)
                fallback()
            }
        }
    }

    // --- Sensor fallback ---

    private fun getStepsTodayFromSensor(call: PluginCall) {
        if (stepSensor == null) {
            call.reject("No step counter on this device")
            return
        }
        if (!hasActivityPermission()) {
            call.reject("Physical activity permission not granted")
            return
        }
        registerStepSensor()
        if (sensorCounter.hasReadingThisSession) {
            resolveSensorSteps(call)
            return
        }

        // The sensor reports shortly after registering; answer then, or after a timeout
        call.setKeepAlive(true)
        pendingSensorCalls.add(call)
        handler.postDelayed({
            if (pendingSensorCalls.remove(call)) {
                call.setKeepAlive(false)
                resolveSensorSteps(call)
            }
        }, FIRST_READING_TIMEOUT_MS)
    }

    private fun resolveSensorSteps(call: PluginCall) {
        call.resolve(JSObject().put("steps", sensorCounter.stepsToday()))
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        sensorCounter.onReading(context, event.values[0])

        val calls = pendingSensorCalls.toList()
        pendingSensorCalls.clear()
        for (call in calls) {
            call.setKeepAlive(false)
            resolveSensorSteps(call)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit

    private fun registerStepSensor() {
        val sensor = stepSensor ?: return
        if (!isSensorRegistered && hasActivityPermission()) {
            sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
            isSensorRegistered = true
        }
    }

    // --- Helpers and lifecycle ---

    private fun hasActivityPermission(): Boolean =
        // ACTIVITY_RECOGNITION is a runtime permission only from Android 10
        Build.VERSION.SDK_INT < Build.VERSION_CODES.Q ||
            getPermissionState("activityRecognition") == PermissionState.GRANTED

    private fun resolveGranted(call: PluginCall, granted: Boolean) {
        call.resolve(JSObject().put("granted", granted))
    }

    override fun handleOnResume() {
        super.handleOnResume()
        registerStepSensor()
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        if (isSensorRegistered) {
            sensorManager?.unregisterListener(this)
            isSensorRegistered = false
        }
        handler.removeCallbacksAndMessages(null)
        scope.cancel()
    }

    companion object {
        private const val TAG = "StepCounterPlugin"
        private const val FIRST_READING_TIMEOUT_MS = 2000L
    }
}

/**
 * Turns TYPE_STEP_COUNTER's running total since boot into today's steps.
 *
 * Stores the total seen at the start of the day (the baseline). Steps counted
 * before a reboot are kept in an offset, since the sensor total restarts at
 * zero when the phone reboots.
 */
private class SensorStepCounter {
    private var date = ""          // day the counters belong to, yyyy-MM-dd local time
    private var baseline = 0f
    private var offset = 0f
    private var lastTotal = -1f    // -1 until the first reading
    var hasReadingThisSession = false
        private set

    fun load(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        date = prefs.getString(KEY_DATE, "") ?: ""
        baseline = prefs.getFloat(KEY_BASELINE, 0f)
        offset = prefs.getFloat(KEY_OFFSET, 0f)
        lastTotal = prefs.getFloat(KEY_LAST_TOTAL, -1f)
    }

    fun onReading(context: Context, total: Float) {
        val today = LocalDate.now().toString()
        when {
            today != date -> {
                // First reading of a new day. If the last reading was yesterday,
                // the steps since then most likely happened this morning.
                val continuesFromYesterday =
                    date == LocalDate.now().minusDays(1).toString() && lastTotal >= 0 && total >= lastTotal
                date = today
                baseline = if (continuesFromYesterday) lastTotal else total
                offset = 0f
            }
            total < lastTotal -> {
                // The phone rebooted and the sensor total restarted from zero
                offset += maxOf(0f, lastTotal - baseline)
                baseline = 0f
            }
        }
        lastTotal = total
        hasReadingThisSession = true

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putString(KEY_DATE, date)
            .putFloat(KEY_BASELINE, baseline)
            .putFloat(KEY_OFFSET, offset)
            .putFloat(KEY_LAST_TOTAL, lastTotal)
            .apply()
    }

    fun stepsToday(): Int =
        if (date != LocalDate.now().toString() || lastTotal < 0) 0
        else maxOf(0f, offset + lastTotal - baseline).toInt()

    private companion object {
        const val PREFS_NAME = "step_counter_prefs"
        const val KEY_DATE = "date"
        const val KEY_BASELINE = "baseline"
        const val KEY_OFFSET = "offset"
        const val KEY_LAST_TOTAL = "last_total"
    }
}
