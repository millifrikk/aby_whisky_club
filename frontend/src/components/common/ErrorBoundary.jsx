import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Something went wrong
              </h3>
              <p className="text-red-700 mt-1">
                {this.props.fallbackMessage || 'An error occurred while rendering this component.'}
              </p>
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-red-700 font-medium">
                Error Details (Development Only)
              </summary>
              <div className="mt-2 bg-red-100 p-3 rounded text-sm font-mono">
                <div className="font-bold text-red-800">Error:</div>
                <div className="text-red-700 mb-2">{this.state.error && this.state.error.toString()}</div>
                <div className="font-bold text-red-800">Stack Trace:</div>
                <div className="text-red-700 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
              </div>
            </details>
          )}
          
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;