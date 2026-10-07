import UIKit
import Capacitor

/// Bridge view controller that registers the plugins living in the app target.
/// Capacitor only auto-registers plugins from npm packages (packageClassList).
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(StepCounterPlugin())
    }
}
