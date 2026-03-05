import React, { createContext, useReducer, useCallback } from 'react';

/**
 * AppStateContext: Global application state management
 * 
 * Manages 5-phase state machine:
 * CHECKING_ENGINE → SELECTING_SOURCE → DASHBOARD → SETUP → PLAYING
 * 
 * Dev tunnel URL configuration happens inline in BootSequence (OFFLINE state)
 * Enforces valid transitions and prevents phase skipping
 */
const AppStateContext = createContext();

/**
 * Initial application state
 * Represents the very first app load state
 */
const initialState = {
  phase: 'CHECKING_ENGINE',
  previousPhase: null,
  isTransitioning: false,
  transitionTarget: null,
  connectionStatus: 'CHECKING',
  devTunnelUrl: localStorage.getItem('devTunnelUrl') || '',
  isDeployed: typeof window !== 'undefined' && !window.location.hostname.includes('localhost'),
  selectedModel: null,
  isModelHydrated: false,
  selectedFandom: null,
  storySetup: null,
  currentStoryId: null,
  userStories: [],
  user: null,
  isUserHydrated: false,
  error: null,
  timestamp: new Date().toISOString(),
};

/**
 * Valid phase transitions
 * Defines which phases can transition to which phases
 */
const validTransitions = {
  CHECKING_ENGINE: ['SELECTING_SOURCE', 'ABOUT'], // Can access About even when offline
  SELECTING_SOURCE: ['DASHBOARD', 'ABOUT'], // Can access About from model selection
  DASHBOARD: ['SETUP', 'PLAYING', 'ABOUT'], // Can go to setup, playing, or about
  ABOUT: ['DASHBOARD', 'SELECTING_SOURCE', 'CHECKING_ENGINE'], // Can go back to any early phase
  SETUP: ['PLAYING', 'DASHBOARD'], // Can go back to dashboard or forward to playing
  PLAYING: ['DASHBOARD', 'SETUP'], // Can go back to dashboard or setup from story reader
};

/**
 * AppState reducer function
 * 
 * Handles all state mutations through actions.
 * Validates phase transitions before updating state.
 * Maintains immutability and phase consistency.
 * 
 * @param {Object} state - Current state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} Updated state
 */
function appStateReducer(state, action) {
  switch (action.type) {
    // ============ Connection Check Actions ============

    case 'CONNECTION_CHECK_START':
      return {
        ...state,
        connectionStatus: 'CHECKING',
        error: null,
      };

    case 'CONNECTION_CHECK_SUCCESS':
      return {
        ...state,
        connectionStatus: 'ONLINE',
        error: null,
        timestamp: new Date().toISOString(),
      };

    case 'CONNECTION_CHECK_FAILURE':
      return {
        ...state,
        connectionStatus: 'OFFLINE',
        error: {
          code: 'CONNECTION_FAILED',
          message:
            action.payload?.message ||
            'Ollama is not awakened yet. Call it forth to begin.',
          phase: state.phase,
          timestamp: new Date().toISOString(),
        },
      };

    case 'CONNECTION_CHECK_CORS_ERROR':
      /**
       * CORS Error: Ollama is running but browser policy blocks access.
       * Typically solved by starting Ollama with OLLAMA_ORIGINS env var.
       */
      return {
        ...state,
        connectionStatus: 'CORS_ERROR',
        error: {
          code: 'CORS_ERROR',
          message:
            action.payload?.message ||
            'Browser blocked access to Ollama. See instructions below.',
          corsFix: action.payload?.corsFix,
          phase: state.phase,
          timestamp: new Date().toISOString(),
        },
      };

    case 'CONNECTION_RETRY':
      return {
        ...state,
        connectionStatus: 'CHECKING',
        error: null,
      };

    case 'OLLAMA_URL_CONFIGURED':
      return {
        ...state,
        devTunnelUrl: action.payload.devTunnelUrl || '',
        error: null,
      };

    // ============ Model Selection Actions ============

    case 'MODEL_SELECTED':
      return {
        ...state,
        selectedModel: action.payload.model,
        error: null,
      };

    case 'MODEL_HYDRATE_START':
      return {
        ...state,
        isModelHydrated: false,
      };

    case 'MODEL_HYDRATE_COMPLETE':
      return {
        ...state,
        selectedModel: action.payload?.model || null,
        isModelHydrated: true,
        error: null,
      };

    // ============ Fandom Selection Actions ============

    case 'FANDOM_SELECTED':
      return {
        ...state,
        selectedFandom: action.payload.fandom,
        error: null,
      };

    // ============ Story Setup Actions ============

    case 'STORY_SETUP_UPDATED':
      return {
        ...state,
        storySetup: {
          ...state.storySetup,
          ...action.payload,
        },
        error: null,
      };

    case 'STORY_SETUP_RESET':
      return {
        ...state,
        storySetup: null,
        selectedFandom: null,
        error: null,
      };

    // ============ Story Creation Actions ============

    case 'STORY_CREATED':
      return {
        ...state,
        currentStoryId: action.payload.storyId,
        error: null,
      };

    // ============ Story Resume Actions ============

    case 'RESUME_STORY':
      return {
        ...state,
        currentStoryId: action.payload.storyId,
        error: null,
      };

    // ============ Phase Transition Actions ============

    case 'TRANSITION_TO_CHECKING_ENGINE':
      if (state.isTransitioning) return state;
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'CHECKING_ENGINE',
      };

    case 'TRANSITION_TO_SELECTING_SOURCE':
      if (state.isTransitioning) return state;
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'SELECTING_SOURCE',
      };

    case 'TRANSITION_TO':
      // Generic transition handler (for dynamic phase transitions)
      if (state.isTransitioning) return state;
      const nextPhase = action.payload?.targetPhase;
      if (nextPhase && validTransitions[state.phase]?.includes(nextPhase)) {
        return {
          ...state,
          isTransitioning: true,
          transitionTarget: nextPhase,
        };
      }
      return state;

    case 'TRANSITION_TO_DASHBOARD':
      if (state.isTransitioning) return state; // Already transitioning
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'DASHBOARD',
      };

    case 'TRANSITION_TO_SETUP':
      if (state.isTransitioning) return state;
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'SETUP',
      };

    case 'TRANSITION_TO_ABOUT':
      if (state.isTransitioning) return state;
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'ABOUT',
      };

    case 'TRANSITION_TO_PLAYING':
      if (state.isTransitioning) return state;
      return {
        ...state,
        isTransitioning: true,
        transitionTarget: 'PLAYING',
      };

    case 'TRANSITION_COMPLETE':
      const targetPhase = action.payload?.targetPhase;
      // Validate transition is allowed
      if (
        targetPhase &&
        validTransitions[state.phase] &&
        validTransitions[state.phase].includes(targetPhase)
      ) {
        return {
          ...state,
          previousPhase: state.phase,
          phase: targetPhase,
          isTransitioning: false,
          transitionTarget: null,
          error: null,
          timestamp: new Date().toISOString(),
        };
      }
      // Invalid transition - log error
      console.error(
        `Invalid phase transition: ${state.phase} → ${targetPhase}`
      );
      return state;

    case 'TRANSITION_CANCELLED':
      return {
        ...state,
        isTransitioning: false,
        transitionTarget: null,
      };

    // ============ Error Handling ============

    case 'SET_ERROR':
      return {
        ...state,
        error: {
          code: action.payload.code,
          message: action.payload.message,
          phase: state.phase,
          timestamp: new Date().toISOString(),
        },
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    // ============ Dashboard Data ============

    case 'SET_USER_STORIES':
      return {
        ...state,
        userStories: action.payload,
        error: null,
      };

    // ============ User Authentication ============

    case 'USER_HYDRATE_START':
      return {
        ...state,
        isUserHydrated: false,
      };

    case 'USER_HYDRATE_COMPLETE':
      return {
        ...state,
        user: action.payload?.user || null,
        isUserHydrated: true,
        error: null,
      };

    case 'USER_LOGIN':
      return {
        ...state,
        user: action.payload.user,
        error: null,
      };

    case 'USER_LOGOUT':
      return {
        ...state,
        user: null,
        userStories: [],
        error: null,
      };

    // ============ URL Synchronization ============

    case 'SYNC_PHASE_FROM_URL':
      // Update phase based on URL change (browser back/forward)
      // Skips transition animations - instant phase change
      const urlPhase = action.payload.phase;
      if (urlPhase && urlPhase !== state.phase) {
        return {
          ...state,
          previousPhase: state.phase,
          phase: urlPhase,
          isTransitioning: false,
          transitionTarget: null,
          error: null,
        };
      }
      return state;

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

/**
 * AppStateProvider: Context provider component
 * 
 * Wraps application with React Context for global state access
 * Provides state and dispatch to all child components
 * Hydrates user from /api/auth/me on mount
 */
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  React.useEffect(() => {
    /**
     * Hydrate authenticated user from /api/auth/me on app load.
     * Sets isUserHydrated=true regardless of auth status.
     * This ensures dashboard knows whether to show auth prompt.
     */
    async function hydrateUser() {
      dispatch({ type: 'USER_HYDRATE_START' });
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include session cookie
        });
        
        // Handle non-OK responses
        if (!response.ok) {
          console.warn('Auth check returned:', response.status);
          dispatch({
            type: 'USER_HYDRATE_COMPLETE',
            payload: { user: null },
          });
          return;
        }

        const data = await response.json();
        dispatch({
          type: 'USER_HYDRATE_COMPLETE',
          payload: data,
        });
      } catch (error) {
        console.error('User hydration failed:', error);
        // Hydration complete but user is null (logged out)
        dispatch({
          type: 'USER_HYDRATE_COMPLETE',
          payload: { user: null },
        });
      }
    }

    hydrateUser();
  }, []);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * useAppState: Hook to access app state and dispatch
 * 
 * Usage in components:
 *   const { state, dispatch } = useAppState();
 *   dispatch({ type: 'MODEL_SELECTED', payload: { model } });
 * 
 * @returns {Object} { state, dispatch }
 */
export function useAppState() {
  const context = React.useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

export default AppStateContext;
