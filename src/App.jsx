import { Suspense, lazy, useState, useEffect } from 'react';
import { AppStateProvider, useAppState } from '@/services/appState.jsx';
import UIRouter from '@/components/UIRouter';

// Lazy load Canvas to avoid circular dependency issues
const CanvasScene = lazy(() => import('./canvas/CanvasScene'));

/**
 * Detects WebGL support in the browser
 * 
 * @returns {boolean} True if WebGL is supported
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * AppContent: Inner component with access to app state
 * Conditionally renders canvas based on current phase and WebGL support
 */
function AppContent() {
  const { state } = useAppState();
  const [webglSupported, setWebglSupported] = useState(true);
  
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  const showCanvas = state.phase !== 'PLAYING' && webglSupported;

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* WebGL Not Supported Warning */}
      {!webglSupported && state.phase !== 'PLAYING' && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center z-0">
          <p className="text-blue-200 text-center px-6">
            3D visualization unavailable. Your browser does not support WebGL.
          </p>
        </div>
      )}

      {/* 3D Canvas Layer: Hidden during PLAYING phase or if WebGL not supported */}
      {showCanvas && (
        <Suspense fallback={null}>
          <CanvasScene />
        </Suspense>
      )}

      {/* UI Overlay Layer: Phase-based screens and interactions */}
      <div className="absolute top-0 left-0 z-10 w-full h-full pointer-events-auto">
        <UIRouter />
      </div>
    </div>
  );
}

/**
 * App: Root component for StoryTeller
 * 
 * Architecture:
 * - AppStateProvider: Wraps entire app with global state context
 * - Canvas layer: Three.js 3D scene (absolute z-0, pointer-events: none)
 *   - Hidden during PLAYING phase for full-screen story reading
 * - UIRouter: Phase-based UI overlay (absolute z-10+, interactive)
 * 
 * Canvas and UI operate independently:
 * - Canvas renders continuously if visible
 * - UI dispatches state changes that trigger canvas animations
 * - No direct communication between layers (state machine is bridge)
 * - Canvas unmounts during PLAYING phase to free resources
 */
export default function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}
