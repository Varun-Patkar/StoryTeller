import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/services/appState.jsx';
import { getAvailableModels, checkOllamaConnection } from '@/services/mockApi';
import { useRouteSync } from '@/services/useRouteSync';
import { useDocumentTitle } from '@/utils/seo';
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
 * Synchronizes URL with app state machine
 */
function AppContent() {
  const { state, dispatch } = useAppState();
  const [webglSupported, setWebglSupported] = useState(true);
  
  // Sync URL with app state bidirectionally
  useRouteSync();
  
  // Update document title based on current route
  useDocumentTitle();
  
  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  useEffect(() => {
    let isMounted = true;

    /**
     * Check Ollama connection on app load.
     * This ensures connection status is known regardless of entry route.
     *
     * @returns {Promise<void>}
     */
    async function checkConnection() {
      dispatch({ type: 'CONNECTION_CHECK_START' });

      try {
        const result = await checkOllamaConnection();
        if (!isMounted) return;

        if (result.status === 'online') {
          dispatch({ type: 'CONNECTION_CHECK_SUCCESS' });
        } else if (result.status === 'cors_error') {
          dispatch({
            type: 'CONNECTION_CHECK_CORS_ERROR',
            payload: {
              message: 'Browser blocked access to Ollama. See instructions below.',
              corsFix: 'OLLAMA_ORIGINS="http://localhost:5173" ollama serve',
            },
          });
        } else {
          dispatch({
            type: 'CONNECTION_CHECK_FAILURE',
            payload: {
              message: 'Ollama is not awakened yet. Call it forth to begin.',
            },
          });
        }
      } catch (error) {
        console.error('Connection check failed:', error);
        if (isMounted) {
          dispatch({
            type: 'CONNECTION_CHECK_FAILURE',
            payload: {
              message: 'Failed to reach Ollama. Ensure it is running.',
            },
          });
        }
      }
    }

    checkConnection();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Hydrates the selected model from localStorage and validates it against API.
     * Ensures model selection is one-time unless the model no longer exists.
     *
     * @returns {Promise<void>}
     */
    async function hydrateSelectedModel() {
      dispatch({ type: 'MODEL_HYDRATE_START' });

      let savedModel = null;
      try {
        const rawModel = localStorage.getItem('selectedModel');
        savedModel = rawModel ? JSON.parse(rawModel) : null;
      } catch (storageError) {
        console.warn('Failed to read saved model from storage:', storageError);
        savedModel = null;
      }

      if (!savedModel) {
        if (isMounted) {
          dispatch({ type: 'MODEL_HYDRATE_COMPLETE', payload: { model: null } });
        }
        return;
      }

      try {
        const availableModels = await getAvailableModels();
        if (!isMounted) return;

        const matchingModel = availableModels.find(model => model.id === savedModel.id);
        if (matchingModel) {
          dispatch({ type: 'MODEL_HYDRATE_COMPLETE', payload: { model: matchingModel } });
          return;
        }

        localStorage.removeItem('selectedModel');
        dispatch({ type: 'MODEL_HYDRATE_COMPLETE', payload: { model: null } });
      } catch (loadError) {
        console.error('Failed to validate saved model:', loadError);
        if (isMounted) {
          dispatch({ type: 'MODEL_HYDRATE_COMPLETE', payload: { model: null } });
        }
      }
    }

    hydrateSelectedModel();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {/* WebGL Not Supported Warning */}
      {!webglSupported && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center z-0">
          <p className="text-blue-200 text-center px-6">
            3D visualization unavailable. Your browser does not support WebGL.
          </p>
        </div>
      )}

      {/* 3D Canvas Layer: Always visible in background */}
      {webglSupported && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <CanvasScene />
          </Suspense>
        </div>
      )}

      {/* UI Overlay Layer: Always on top of canvas with proper stacking context */}
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
 * - BrowserRouter: Enables URL-based navigation with browser history
 * - AppStateProvider: Wraps entire app with global state context
 * - Canvas layer: Three.js 3D scene (absolute z-0, pointer-events: none)
 *   - Hidden during PLAYING phase for full-screen story reading
 * - UIRouter: Route-based UI overlay (absolute z-10+, interactive)
 * 
 * Canvas and UI operate independently:
 * - Canvas renders continuously if visible
 * - UI dispatches state changes that trigger canvas animations
 * - No direct communication between layers (state machine is bridge)
 * - Canvas unmounts during PLAYING phase to free resources
 * - Routes sync with state machine for seamless transitions
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppStateProvider>
        <AppContent />
      </AppStateProvider>
    </BrowserRouter>
  );
}
