#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(StepCounterPlugin, "StepCounter",
    CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getStepsToday, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getStepsForDateRange, CAPPluginReturnPromise);
)
