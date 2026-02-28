import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

/**
 * Application entry point
 * 
 * Renders React app into #root element with StrictMode for development warnings.
 * ErrorBoundary catches and displays any React errors gracefully.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
