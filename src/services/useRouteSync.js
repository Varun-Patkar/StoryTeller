import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from './appState.jsx';

/**
 * useRouteSync: Synchronize URL with app state machine
 * 
 * Keeps the phase state in sync with URL changes with proper animations:
 * - When URL changes → trigger transition with camera animations
 * 
 * Components use navigate() + transition dispatches for programmatic navigation.
 * This hook handles browser-initiated navigation (back/forward/manual URL entry).
 * 
 * This enables:
 * - Browser back/forward buttons trigger animations correctly
 * - Direct URL access triggers appropriate entry animation
 * - Bookmarkable states with cinematic transitions
 * 
 * @returns {void}
 */
export function useRouteSync() {
  const location = useLocation();
  const { state, dispatch } = useAppState();

  /**
   * Map URL paths to app phases
   * Note: '/' is handled explicitly to avoid invalid back-transitions
   */
  const pathToPhase = {
    '/dashboard': 'DASHBOARD',
    '/new': 'SETUP',
  };

  /**
   * Map phases to their transition action types
   */
  const phaseToTransition = {
    'CHECKING_ENGINE': 'TRANSITION_TO_CHECKING_ENGINE',
    'SELECTING_SOURCE': 'TRANSITION_TO_SELECTING_SOURCE',
    'DASHBOARD': 'TRANSITION_TO_DASHBOARD',
    'SETUP': 'TRANSITION_TO_SETUP',
    'PLAYING': 'TRANSITION_TO_PLAYING',
  };

  /**
   * Sync URL changes to phase state with animations
   * Triggered when user navigates via browser (back/forward/manual URL entry)
   */
  useEffect(() => {
    const currentPath = location.pathname;

    // Wait for model hydration before applying URL-driven transitions
    if (!state.isModelHydrated) {
      return;
    }
    
    // Handle story URLs separately (dynamic slug)
    if (currentPath.startsWith('/story/')) {
      if (state.phase !== 'PLAYING' && !state.isTransitioning) {
        dispatch({ type: 'TRANSITION_TO_PLAYING' });
      }
      return;
    }

    // Smart "/" handling: avoid invalid transitions back to CHECKING_ENGINE
    if (currentPath === '/') {
      if (state.connectionStatus === 'ONLINE') {
        // If redirected to model selection due to missing model, skip animation
        if (!state.selectedModel && state.phase !== 'SELECTING_SOURCE') {
          dispatch({ type: 'SYNC_PHASE_FROM_URL', payload: { phase: 'SELECTING_SOURCE' } });
        } else if (state.phase !== 'SELECTING_SOURCE' && !state.isTransitioning) {
          dispatch({ type: 'TRANSITION_TO_SELECTING_SOURCE' });
        }
      } else {
        // Only transition to CHECKING_ENGINE if we are not already at boot or model selection
        const isAlreadyAtRootPhase = state.phase === 'CHECKING_ENGINE' || state.phase === 'SELECTING_SOURCE';
        if (!isAlreadyAtRootPhase && !state.isTransitioning) {
          dispatch({ type: 'TRANSITION_TO_CHECKING_ENGINE' });
        }
      }
      return;
    }

    // Map URL to phase (standard routing)
    const targetPhase = pathToPhase[currentPath];
    
    if (targetPhase && targetPhase !== state.phase && !state.isTransitioning) {
      // URL changed, trigger transition with animation
      const transitionAction = phaseToTransition[targetPhase];
      if (transitionAction) {
        dispatch({ type: transitionAction });
      }
    }
    // Only re-run when URL changes, not when phase/transition state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, dispatch, state.connectionStatus, state.isModelHydrated, state.selectedModel, state.phase, state.isTransitioning]);
}
