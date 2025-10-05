import Foundation
import Capacitor
import HealthKit

@objc(StepCounterPlugin)
public class StepCounterPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        // Check if HealthKit is available
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }
        
        // Define the data type we want to read (Step Count)
        guard let stepCountType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }
        
        let typesToRead: Set<HKObjectType> = [stepCountType]
        
        // Request Authorization
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { (success, error) in
            if success {
                call.resolve(["granted": true])
            } else {
                call.resolve(["granted": false])
            }
        }
    }
    
    @objc func getStepsToday(_ call: CAPPluginCall) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }
        
        let now = Date()
        let startOfDay = Calendar.current.startOfDay(for: now)
        
        // Predicate to filter data for the current day
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictEndDate)
        
        // Query to sum all step data for the day
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                call.resolve(["steps": 0])
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            call.resolve(["steps": Int(steps)])
        }
        
        healthStore.execute(query)
    }
    
    @objc func getStepsForDateRange(_ call: CAPPluginCall) {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
            call.reject("Step count type not available")
            return
        }
        
        guard let startDateString = call.getString("startDate"),
              let endDateString = call.getString("endDate") else {
            call.reject("Start date and end date are required")
            return
        }
        
        let dateFormatter = ISO8601DateFormatter()
        guard let startDate = dateFormatter.date(from: startDateString),
              let endDate = dateFormatter.date(from: endDateString) else {
            call.reject("Invalid date format. Use ISO8601 format")
            return
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictEndDate)
        
        let query = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, result, error in
            guard let result = result, let sum = result.sumQuantity() else {
                call.resolve(["steps": 0])
                return
            }
            
            let steps = sum.doubleValue(for: HKUnit.count())
            call.resolve(["steps": Int(steps)])
        }
        
        healthStore.execute(query)
    }
}
