import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Tulasetu] Uncaught render error', error?.message || error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-card-white border border-card-border rounded-2xl shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-status-error-bg text-status-error flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Something went wrong</h1>
            <p className="mt-2 text-sm text-text-muted">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="mt-6 px-4 py-2 rounded-lg bg-sea-ink hover:bg-sea-teal text-cream text-sm font-semibold transition-colors cursor-pointer"
            >
              Return to home
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
