import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; replace with error reporting service in prod
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      if (fallback) return fallback;

      return (
        <div className="panel-wide flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-2xl">⚠️</p>
          <p className="panel-title">Something went wrong</p>
          <p className="text-sm text-muted max-w-sm">
            {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <button className="btn-secondary" type="button" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
