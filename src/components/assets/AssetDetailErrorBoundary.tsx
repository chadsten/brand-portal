import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AssetDetailErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AssetDetailErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export class AssetDetailErrorBoundary extends React.Component<
  AssetDetailErrorBoundaryProps,
  AssetDetailErrorBoundaryState
> {
  constructor(props: AssetDetailErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AssetDetailErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AssetDetailModal Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle size={48} className="text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-base-content/60 mb-4 max-w-md">
            We encountered an error while loading the asset details. Please try again.
          </p>
          {this.state.error && (
            <details className="mb-4 text-sm text-base-content/60">
              <summary className="cursor-pointer mb-2">Error details</summary>
              <pre className="text-left bg-base-200 p-2 rounded max-w-md overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            className="btn btn-primary gap-2"
            onClick={this.handleRetry}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}