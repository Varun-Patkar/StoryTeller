import { Component } from 'react';

/**
 * ErrorBoundary: Catches React errors in component tree
 * 
 * Prevents white screen of death by catching errors and displaying
 * a mystical error message. Logs errors to console for debugging.
 * 
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 * 
 * @component
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state when an error is caught
   * 
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state object
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs error details to console
   * 
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Additional error information
   */
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Resets the error boundary state
   * Allows user to try again
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-black flex items-center justify-center">
          <div className="max-w-md text-center px-6">
            <h1 className="text-3xl text-red-400 font-bold mb-4">
              The Tapestry Unravels
            </h1>
            <p className="text-blue-200 mb-6">
              A disturbance in the realm has occurred. The tale cannot continue.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors font-semibold"
            >
              Return to the Beginning
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
