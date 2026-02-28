import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from './appState.jsx';

/**
 * useRouteSync: Synchronize URL with app state machine
 * 
 * Keeps the URL and phase state in sync bidirectionally:
 * - When URL changes → update phase
 * - When phase changes → update URL
 * 
 * This enables:
 * - Browser back/forward buttons work correctly
 * - Direct URL access to any phase
 * - Bookmarkable states
 * - Shareable URLs
 * 
 * @returns {void}
 */
export function useRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useAppState();

  /**
   * Map URL paths to app phases
   */
  const pathToPhase = {
    '/': 'CHECKING_ENGINE',
    '/select-model': 'SELECTING_SOURCE',
    '/dashboard': 'DASHBOARD',
    '/setup': 'SETUP',
  };

  /**
   * Map app phases to URL paths
   */
  const phaseToPath = {
    'CHECKING_ENGINE': '/',
    'SELECTING_SOURCE': '/select-model',
    'DASHBOARD': '/dashboard',
    'SETUP': '/setup',
    'PLAYING': null, // PLAYING phase uses dynamic /story/:slug URL
  };

  /**
   * Sync URL changes to phase state
   * Triggered when user navigates via browser (back/forward/manual URL entry)
   */
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Handle story URLs separately (dynamic slug)
    if (currentPath.startsWith('/story/')) {
      if (state.phase !== 'PLAYING') {
        // URL indicates story reading, update phase if needed
        // Don't dispatch here as ProtectedRoute will handle redirects
      }
      return;
    }

    // Map URL to phase
    const targetPhase = pathToPhase[currentPath];
    
    if (targetPhase && targetPhase !== state.phase && !state.isTransitioning) {
      // URL changed, update phase to match
      // Note: This won't trigger animations, just updates state
      // For animated transitions, components should use dispatch with transition actions
      dispatch({ type: 'SYNC_PHASE_FROM_URL', payload: { phase: targetPhase } });
    }
  }, [location.pathname, state.phase, state.isTransitioning]);

  /**
   * Sync phase changes to URL
   * Triggered when app state changes programmatically
   */
  useEffect(() => {
    const currentPath = location.pathname;
    const targetPath = phaseToPath[state.phase];

    // Skip if phase doesn't map to a static path (e.g., PLAYING uses slug)
    if (targetPath === null) {
      return;
    }

    // Skip if already at the correct URL
    if (targetPath === currentPath) {
      return;
    }

    // Skip if transitioning (wait for transition to complete)
    if (state.isTransitioning) {
      return;
    }

    // Phase changed, update URL to match
    navigate(targetPath, { replace: false });
  }, [state.phase, state.isTransitioning]);
}
