import Foundation
import Capacitor
import HealthKit

/// Reads step counts from HealthKit.
@objc(StepCounterPlugin)
public class StepCounterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StepCounterPlugin"
    public let jsName = "StepCounter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStepsToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStepsForDateRange", returnType: CAPPluginReturnPromise)
    ]

    private let healthStore = HKHealthStore()

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }
        guard let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }

        // HealthKit never reveals whether read access was denied; success only
        // means the prompt was handled. Denied access simply returns no samples.
        healthStore.requestAuthorization(toShare: nil, read: [stepType]) { success, _ in
            call.resolve(["granted": success])
        }
    }

    @objc func getStepsToday(_ call: CAPPluginCall) {
        let now = Date()
        querySteps(call, from: Calendar.current.startOfDay(for: now), to: now)
    }

    @objc func getStepsForDateRange(_ call: CAPPluginCall) {
        guard let startDateString = call.getString("startDate"),
              let endDateString = call.getString("endDate") else {
            call.reject("Start date and end date are required")
            return
        }
        guard let startDate = Self.parseISODate(startDateString),
              let endDate = Self.parseISODate(endDateString) else {
            call.reject("Invalid date format. Use ISO 8601")
            return
        }
        querySteps(call, from: startDate, to: endDate)
    }

    private func querySteps(_ call: CAPPluginCall, from startDate: Date, to endDate: Date) {
        guard HKHealthStore.isHealthDataAvailable(),
              let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("HealthKit is not available on this device")
            return
        }

        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, _ in
            let steps = result?.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
            call.resolve(["steps": Int(steps)])
        }
        healthStore.execute(query)
    }

    /// Accepts both "2026-10-06T00:00:00Z" and JavaScript's toISOString() output
    /// "2026-10-06T00:00:00.000Z", which the default ISO8601DateFormatter rejects.
    private static func parseISODate(_ value: String) -> Date? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return withFraction.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
}
