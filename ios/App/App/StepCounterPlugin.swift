import Foundation
import Capacitor
import HealthKit

@objc(StepCounterPlugin)
public class StepCounterPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StepCounterPlugin"
    public let jsName = "StepCounter"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStepsToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStepsForDateRange", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStepsForMonth", returnType: CAPPluginReturnPromise)
    ]
    
    private let healthStore = HKHealthStore()
    
    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        print("StepCounterPlugin: requestPermissions called")
        
        // Check if HealthKit is available
        guard HKHealthStore.isHealthDataAvailable() else {
            print("StepCounterPlugin: HealthKit is not available on this device")
            call.reject("HealthKit is not available on this device")
            return
        }
        
        // Define the data type we want to read (Step Count)
        guard let stepCountType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            print("StepCounterPlugin: Step count type not available")
            call.reject("Step count type not available")
            return
        }
        
        let typesToRead: Set<HKObjectType> = [stepCountType]
        
        print("StepCounterPlugin: Requesting authorization for step count...")
        
        // Request Authorization
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { [weak self] (success, error) in
            print("StepCounterPlugin: Authorization callback - success: \(success), error: \(String(describing: error))")
            
            if let error = error {
                print("StepCounterPlugin: Authorization error: \(error.localizedDescription)")
                call.reject("Authorization failed: \(error.localizedDescription)")
                return
            }
            
            // Note: On iOS, requestAuthorization returns success even if user denies
            // We need to check actual authorization status
            let authStatus = self?.healthStore.authorizationStatus(for: stepCountType)
            print("StepCounterPlugin: Authorization status for stepCount: \(String(describing: authStatus?.rawValue))")
            
            // Try to actually query for steps to verify we have access
            // If we can query, we have access
            DispatchQueue.main.async {
                call.resolve(["granted": success])
            }
        }
    }
    
    @objc func getStepsToday(_ call: CAPPluginCall) {
        print("StepCounterPlugin: getStepsToday called")
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            print("StepCounterPlugin: Step count type not available")
            call.reject("Step count type not available")
            return
        }
        
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        
        print("StepCounterPlugin: Querying steps from \(startOfDay) to \(now)")
        
        // Predicate to filter data for the current day
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictEndDate)
        
        // Query to sum all step data for the day
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                print("StepCounterPlugin: Query error: \(error.localizedDescription)")
            }
            
            guard let result = result, let sum = result.sumQuantity() else {
                print("StepCounterPlugin: No step data available, returning 0")
                DispatchQueue.main.async {
                    call.resolve(["steps": 0])
                }
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            print("StepCounterPlugin: Got \(Int(steps)) steps for today")
            
            DispatchQueue.main.async {
                call.resolve(["steps": Int(steps)])
            }
        }
        
        healthStore.execute(query)
    }
    
    @objc func getStepsForDateRange(_ call: CAPPluginCall) {
        print("StepCounterPlugin: getStepsForDateRange called")
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }
        
        guard let startDateString = call.getString("startDate"),
              let endDateString = call.getString("endDate") else {
            call.reject("Start date and end date are required")
            return
        }
        
        guard let startDate = Self.parseISODate(startDateString),
              let endDate = Self.parseISODate(endDateString) else {
            call.reject("Invalid date format. Use ISO8601 format")
            return
        }
        
        print("StepCounterPlugin: Querying steps from \(startDate) to \(endDate)")
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)
        
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            if let error = error {
                print("StepCounterPlugin: Query error: \(error.localizedDescription)")
            }
            
            guard let result = result, let sum = result.sumQuantity() else {
                print("StepCounterPlugin: No step data for date range, returning 0")
                DispatchQueue.main.async {
                    call.resolve(["steps": 0])
                }
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            print("StepCounterPlugin: Got \(Int(steps)) steps for date range")
            
            DispatchQueue.main.async {
                call.resolve(["steps": Int(steps)])
            }
        }
        
        healthStore.execute(query)
    }

    /// Accepts JavaScript's toISOString() output ("2026-10-06T00:00:00.000Z"),
    /// which a default ISO8601DateFormatter rejects because of the milliseconds.
    private static func parseISODate(_ value: String) -> Date? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return withFraction.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }

    /// Daily step totals for a whole calendar month in ONE HealthKit query.
    ///
    /// `HKStatisticsCollectionQuery` with a 1-day interval lets HealthKit do the
    /// per-day bucketing natively, so a month costs one round trip across the
    /// Capacitor bridge instead of ~30. Days with no samples are returned as 0
    /// so the calendar can show a real "0" rather than a blank cell.
    @objc func getStepsForMonth(_ call: CAPPluginCall) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }

        guard let year = call.getInt("year"), let month = call.getInt("month") else {
            call.reject("year and month are required")
            return
        }

        // Local calendar on purpose: HealthKit buckets by the user's wall-clock
        // day, and the JS layer keys rows by local yyyy-MM-dd.
        var calendar = Calendar.current
        calendar.timeZone = TimeZone.current

        var startComponents = DateComponents()
        startComponents.year = year
        startComponents.month = month
        startComponents.day = 1

        guard let monthStart = calendar.date(from: startComponents),
              let monthEnd = calendar.date(byAdding: DateComponents(month: 1), to: monthStart) else {
            call.reject("Invalid year/month")
            return
        }

        let now = Date()
        let queryEnd = min(monthEnd, calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: now)) ?? monthEnd)

        let predicate = HKQuery.predicateForSamples(withStart: monthStart, end: queryEnd, options: .strictStartDate)
        var interval = DateComponents()
        interval.day = 1

        let query = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum,
            anchorDate: monthStart,
            intervalComponents: interval
        )

        let formatter = DateFormatter()
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"

        query.initialResultsHandler = { _, collection, error in
            if let error = error {
                print("StepCounterPlugin: month query error: \(error.localizedDescription)")
                DispatchQueue.main.async { call.reject("Month query failed: \(error.localizedDescription)") }
                return
            }

            var totals: [String: Int] = [:]

            // Seed every day up to today with 0 so zero-step days are explicit.
            var cursor = monthStart
            while cursor < queryEnd {
                totals[formatter.string(from: cursor)] = 0
                guard let next = calendar.date(byAdding: .day, value: 1, to: cursor) else { break }
                cursor = next
            }

            collection?.enumerateStatistics(from: monthStart, to: queryEnd) { statistics, _ in
                let key = formatter.string(from: statistics.startDate)
                let steps = statistics.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0
                totals[key] = Int(steps)
            }

            let days = totals
                .sorted { $0.key < $1.key }
                .map { ["date": $0.key, "steps": $0.value] as [String: Any] }

            print("StepCounterPlugin: month query returned \(days.count) days for \(year)-\(month)")
            DispatchQueue.main.async { call.resolve(["days": days]) }
        }

        healthStore.execute(query)
    }
}
