import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Sentry will auto-capture this via its React integration
    console.error(`[ErrorBoundary:${this.props.section ?? "unknown"}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          padding: "40px 24px", textAlign: "center",
          fontFamily: "'Inter', sans-serif", color: "#6B5B55",
        }}>
          <p style={{ fontSize: "13px", letterSpacing: "0.06em" }}>
            Something went wrong loading this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: "16px", fontSize: "11px", letterSpacing: "0.12em",
              textTransform: "uppercase", background: "none", border: "1px solid #C4985A",
              color: "#C4985A", padding: "8px 20px", cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
