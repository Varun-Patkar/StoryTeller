import React, { createContext, useReducer, useCallback } from 'react';

/**
 * AppStateContext: Global application state management
 * 
 * Manages 5-phase state machine:
 * CHECKING_ENGINE → SELECTING_SOURCE → DASHBOARD → SETUP → PLAYING
 * 
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
  selectedModel: null,
  selectedFandom: null,
  storySetup: null,
  currentStoryId: null,
  userStories: [],
  error: null,
  timestamp: new Date().toISOString(),
};

/**
 * Valid phase transitions
 * Defines which phases can transition to which phases
 */
const validTransitions = {
  CHECKING_ENGINE: ['SELECTING_SOURCE'],
  SELECTING_SOURCE: ['DASHBOARD'],
  DASHBOARD: ['SETUP', 'PLAYING'],
  SETUP: ['PLAYING', 'DASHBOARD'], // Can go back to dashboard or forward to playing
  PLAYING: [], // No transitions from PLAYING in MVP
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

    case 'CONNECTION_RETRY':
      return {
        ...state,
        connectionStatus: 'CHECKING',
        error: null,
      };

    // ============ Model Selection Actions ============

    case 'MODEL_SELECTED':
      return {
        ...state,
        selectedModel: action.payload.model,
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
 */
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

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
