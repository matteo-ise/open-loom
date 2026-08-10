import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from './icons';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
          <Icon.Warning width={48} height={48} style={{ color: 'var(--red-500)' }} />
          <h2>Something went wrong.</h2>
          <p style={{ opacity: 0.7 }}>{this.state.error?.message}</p>
          <button 
            className="btn-primary" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
