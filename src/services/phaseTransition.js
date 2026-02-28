import { useEffect, useRef } from 'react';
import { useAppState } from './appState.jsx';
import gsap from 'gsap';

/**
 * usePhaseTransition: Custom hook for phase transition animations
 * 
 * Monitors transitionTarget state and triggers GSAP animations.
 * Calls animation callback which dispatches TRANSITION_COMPLETE on finish.
 * 
 * Usage:
 *   const cameraRef = useRef();
 *   usePhaseTransition(cameraRef);
 * 
 * @param {React.MutableRefObject} cameraRef - Reference to Three.js camera
 */
export function usePhaseTransition(cameraRef) {
  const { state, dispatch } = useAppState();
  const timelineRef = useRef(null);

  useEffect(() => {
    // Only trigger if transition is requested
    if (!state.transitionTarget || !state.isTransitioning || !cameraRef?.current) {
      return;
    }

    const currentPhase = state.phase;
    const targetPhase = state.transitionTarget;

    console.log(`Animating transition: ${currentPhase} → ${targetPhase}`);

    /**
     * Animation handlers by transition path
     * Each handler triggers appropriate GSAP animation
     * Must call onComplete which dispatches TRANSITION_COMPLETE
     */
    const animationHandlers = {
      'SELECTING_SOURCE->DASHBOARD': () => {
        // Space to Earth animation (will be implemented in T022)
        console.log('Executing spaceToEarth animation');
        // Placeholder - real animation imported in implementation
        setTimeout(() => {
          dispatch({
            type: 'TRANSITION_COMPLETE',
            payload: { targetPhase },
          });
        }, 4000); // 4 second animation duration
      },

      'DASHBOARD->SETUP': () => {
        // Earth to surface animation (will be implemented in T023)
        console.log('Executing earthToSurface animation');
        setTimeout(() => {
          dispatch({
            type: 'TRANSITION_COMPLETE',
            payload: { targetPhase },
          });
        }, 3000); // 3 second animation duration
      },

      'SETUP->PLAYING': () => {
        // Surface to story animation (will be implemented in T024)
        console.log('Executing surfaceToStory animation');
        setTimeout(() => {
          dispatch({
            type: 'TRANSITION_COMPLETE',
            payload: { targetPhase },
          });
        }, 2500); // 2.5 second animation duration
      },

      'DASHBOARD->PLAYING': () => {
        // Resume story - brief animation
        console.log('Executing resume animation');
        setTimeout(() => {
          dispatch({
            type: 'TRANSITION_COMPLETE',
            payload: { targetPhase },
          });
        }, 1500); // 1.5 second animation duration
      },
    };

    const key = `${currentPhase}->${targetPhase}`;
    const handler = animationHandlers[key];

    if (handler) {
      handler();
    } else {
      // No animation required - transition immediately
      console.warn(`No animation handler for transition: ${key}`);
      dispatch({
        type: 'TRANSITION_COMPLETE',
        payload: { targetPhase },
      });
    }

    // Cleanup: cancel animation on unmount
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [state.transitionTarget, state.isTransitioning, cameraRef, dispatch]);
}

export default usePhaseTransition;
