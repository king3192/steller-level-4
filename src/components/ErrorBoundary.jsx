import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    
    // Log exception to Sentry if available
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch {
      // Ignore if Sentry is unconfigured
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 star-grid">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-center">
            <div className="mx-auto w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-heading text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected application error occurred. Don't worry — your Stellar balance and transactions are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left overflow-x-auto max-h-32 text-[11px] text-red-300/90 font-mono">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
