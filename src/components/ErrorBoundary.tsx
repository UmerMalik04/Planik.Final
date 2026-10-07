import { Component, ErrorInfo, ReactNode } from "react";

/**
 * Top-level error boundary.
 * Prevents a single render error in any subtree from blanking the whole app —
 * critical for the offline-first Capacitor build where users may not have
 * devtools to recover from a white screen.
 */
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The app hit an unexpected error. Reload to continue — your data is safe.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
          >
            Reload app
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-xs text-left text-destructive bg-muted p-3 rounded overflow-auto max-h-48">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
