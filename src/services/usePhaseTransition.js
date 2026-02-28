import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppState } from './appState.jsx';
import { spaceToEarth } from '@/animations/spaceToEarth';
import { earthToSurface } from '@/animations/earthToSurface';
import { surfaceToEarth } from '@/animations/surfaceToEarth';
import { surfaceToStory } from '@/animations/surfaceToStory';

/**
 * usePhaseTransition: Custom hook to trigger camera animations on phase changes
 * 
 * Monitors state.transitionTarget and executes corresponding GSAP animations.
 * On animation completion, dispatches TRANSITION_COMPLETE to complete the phase transition.
 * 
 * Usage in Scene component:
 *   const earthModelRef = useRef();
 *   usePhaseTransition(earthModelRef);  // Pass ref object, hook will access ref.current
 * 
 * Animation Mapping:
 * - SELECTING_SOURCE → DASHBOARD: spaceToEarth (z: 300 → 17)
 * - DASHBOARD → SETUP: earthToSurface (z: 17 → 5)
 * - SETUP → DASHBOARD: surfaceToEarth (z: 5 → 17, reverse)
 * - SETUP → PLAYING: surfaceToStory (z: 5 → 1, fade Earth)
 * 
 * @param {React.MutableRefObject} earthModelRef - Reference to Earth mesh/group for fade animation
 */
export function usePhaseTransition(earthModelRef) {
  const { state, dispatch } = useAppState();
  const { camera } = useThree();
  const activeTimelineRef = useRef(null);

  useEffect(() => {
    // Guard: Only process if transitioning
    if (!state.isTransitioning || !state.transitionTarget) {
      return;
    }

    // Kill any existing animation
    if (activeTimelineRef.current) {
      activeTimelineRef.current.kill();
    }

    /**
     * Handles animation completion
     * Dispatches TRANSITION_COMPLETE to update phase and clear transitioning flag
     */
    const handleAnimationComplete = () => {
      dispatch({
        type: 'TRANSITION_COMPLETE',
        payload: { targetPhase: state.transitionTarget },
      });
    };

    try {
      // Select animation based on target phase
      let timeline = null;

      switch (state.transitionTarget) {
        case 'CHECKING_ENGINE':
          // No animation for boot sequence - complete immediately
          handleAnimationComplete();
          return;

        case 'SELECTING_SOURCE':
          // No animation for model selection - complete immediately
          handleAnimationComplete();
          return;

        case 'DASHBOARD':
          // Check source phase to determine animation
          if (state.phase === 'SETUP') {
            // SETUP → DASHBOARD: zoom back out (reverse of earthToSurface)
            timeline = surfaceToEarth(camera, handleAnimationComplete);
          } else {
            // SELECTING_SOURCE → DASHBOARD: space to Earth
            timeline = spaceToEarth(camera, handleAnimationComplete);
          }
          break;

        case 'SETUP':
          // DASHBOARD → SETUP: zoom into surface
          timeline = earthToSurface(camera, handleAnimationComplete);
          break;

        case 'PLAYING':
          // SETUP → PLAYING: zoom into story + fade Earth
          timeline = surfaceToStory(camera, earthModelRef.current, handleAnimationComplete);
          break;

        default:
          console.warn(`Unknown transition target: ${state.transitionTarget}`);
          handleAnimationComplete();
          return;
      }

      // Store timeline for potential cancellation
      activeTimelineRef.current = timeline;
    } catch (error) {
      console.error('Animation error during phase transition:', error);
      // Fallback: Complete transition even if animation fails
      handleAnimationComplete();
    }

    // Cleanup: Cancel animation if component unmounts during transition
    return () => {
      if (activeTimelineRef.current) {
        activeTimelineRef.current.kill();
      }
    };
  }, [state.isTransitioning, state.transitionTarget, camera, dispatch, earthModelRef]);
}
