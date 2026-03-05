import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppState } from './appState.jsx';
import { spaceToEarth } from '@/animations/spaceToEarth';
import { earthToSurface } from '@/animations/earthToSurface';
import { surfaceToEarth } from '@/animations/surfaceToEarth';
import { surfaceToStory } from '@/animations/surfaceToStory';
import { storyToEarth } from '@/animations/storyToEarth';

/**
 * usePhaseTransition: Custom hook to trigger camera animations on phase changes
 * 
 * Monitors state.transitionTarget and executes corresponding GSAP animations.
 * On animation completion, dispatches TRANSITION_COMPLETE to complete the phase transition.
 * Also handles direct phase sync (no animation) by positioning camera correctly.
 * 
 * Usage in Scene component:
 *   const earthModelRef = useRef();
 *   usePhaseTransition(earthModelRef);  // Pass ref object, hook will access ref.current
 * 
 * Animation Mapping:
 * - SELECTING_SOURCE → DASHBOARD: spaceToEarth (z: 300 → 17)
 * - DASHBOARD → SETUP: earthToSurface (z: 17 → 5)
 * - DASHBOARD → ABOUT: earthToSurface (z: 17 → 5, same as SETUP)
 * - ABOUT → DASHBOARD: surfaceToEarth (z: 5 → 17, reverse)
 * - SETUP → DASHBOARD: surfaceToEarth (z: 5 → 17, reverse)
 * - SETUP → PLAYING: surfaceToStory (z: 5 → 1, fade Earth)
 * - PLAYING → DASHBOARD: storyToEarth (z: 1 → 17, restore Earth)
 * - PLAYING → SETUP: storyToEarth (z: 1 → 5, restore Earth)
 * 
 * @param {React.MutableRefObject} earthModelRef - Reference to Earth mesh/group for fade animation
 */
export function usePhaseTransition(earthModelRef) {
  const { state, dispatch } = useAppState();
  const { camera } = useThree();
  const activeTimelineRef = useRef(null);

  /**
   * Camera positions for each phase (for direct URL access without animation)
   */
  const phasePositions = {
    CHECKING_ENGINE: { x: 0, y: 0, z: 300 },
    SELECTING_SOURCE: { x: 0, y: 0, z: 300 },
    DASHBOARD: { x: 12.5, y: 0, z: 17 },
    SETUP: { x: 3, y: 0, z: 5 },
    ABOUT: { x: 3, y: 0, z: 5 }, // Same as SETUP
    PLAYING: { x: 0, y: 0, z: 2 },
  };

  /**
   * Effect: Position camera instantly when phase changes without animation
   * Handles direct URL access (e.g., opening /about directly)
   */
  useEffect(() => {
    // Only position camera if NOT transitioning and camera is far from expected position
    if (state.isTransitioning || !state.phase) {
      return;
    }

    const expectedPosition = phasePositions[state.phase];
    if (!expectedPosition) {
      return;
    }

    // Check if camera is significantly far from expected position (tolerance: 1 unit)
    const distance = Math.sqrt(
      Math.pow(camera.position.x - expectedPosition.x, 2) +
      Math.pow(camera.position.y - expectedPosition.y, 2) +
      Math.pow(camera.position.z - expectedPosition.z, 2)
    );

    if (distance > 1) {
      console.log(`Positioning camera for direct ${state.phase} access:`, expectedPosition);
      camera.position.set(expectedPosition.x, expectedPosition.y, expectedPosition.z);
    }
  }, [state.phase, state.isTransitioning, camera]);

  /**
   * Effect: Handle animated phase transitions
   */
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
          // Unless coming from ABOUT, then animate back to space
          if (state.phase === 'ABOUT') {
            // ABOUT → CHECKING_ENGINE: zoom back to space
            timeline = gsap.timeline({ onComplete: handleAnimationComplete });
            timeline.to(camera.position, {
              x: 12.5,
              z: 17,
              duration: 1.2, // Zoom to orbit
              ease: 'power2.out'
            }).to(camera.position, {
              x: 0,
              z: 300,
              duration: 2, // Zoom to space
              ease: 'power2.out'
            });
          } else {
            handleAnimationComplete();
          }
          return;

        case 'SELECTING_SOURCE':
          // No animation for model selection - complete immediately
          // Unless coming from ABOUT, then animate back to space
          if (state.phase === 'ABOUT') {
            // ABOUT → SELECTING_SOURCE: zoom back to space
            timeline = gsap.timeline({ onComplete: handleAnimationComplete });
            timeline.to(camera.position, {
              x: 12.5,
              z: 17,
              duration: 1.2, // Zoom to orbit
              ease: 'power2.out'
            }).to(camera.position, {
              x: 0,
              z: 300,
              duration: 2, // Zoom to space
              ease: 'power2.out'
            });
          } else {
            handleAnimationComplete();
          }
          return;

        case 'DASHBOARD':
          // Check source phase to determine animation
          if (state.phase === 'SETUP') {
            // SETUP → DASHBOARD: zoom back out (reverse of earthToSurface)
            timeline = surfaceToEarth(camera, handleAnimationComplete);
          } else if (state.phase === 'ABOUT') {
            // ABOUT → DASHBOARD: zoom back out (same as SETUP → DASHBOARD)
            timeline = surfaceToEarth(camera, handleAnimationComplete);
          } else if (state.phase === 'PLAYING') {
            // PLAYING → DASHBOARD: zoom out from story + restore Earth
            timeline = storyToEarth(camera, earthModelRef.current, { x: 12.5, z: 17 }, handleAnimationComplete);
          } else {
            // SELECTING_SOURCE → DASHBOARD: space to Earth
            timeline = spaceToEarth(camera, handleAnimationComplete);
          }
          break;

        case 'SETUP':
          // Check source phase to determine animation
          if (state.phase === 'PLAYING') {
            // PLAYING → SETUP: zoom out from story to surface + restore Earth
            timeline = storyToEarth(camera, earthModelRef.current, { x: 3, z: 5 }, handleAnimationComplete);
          } else {
            // DASHBOARD → SETUP: zoom into surface
            timeline = earthToSurface(camera, handleAnimationComplete);
          }
          break;

        case 'ABOUT':
          // Check source phase to determine animation
          if (state.phase === 'CHECKING_ENGINE' || state.phase === 'SELECTING_SOURCE') {
            // Early phase → ABOUT: Animate from space to surface
            // First move to orbit position (like spaceToEarth), then to surface
            timeline = gsap.timeline({ onComplete: handleAnimationComplete });
            timeline.to(camera.position, {
              x: 12.5,
              z: 17,
              duration: 2, // Quick zoom to orbit
              ease: 'power2.out'
            }).to(camera.position, {
              x: 3,
              z: 5,
              duration: 1.2, // Then zoom to surface
              ease: 'power2.out'
            });
          } else {
            // DASHBOARD → ABOUT: same animation as SETUP (zoom into surface)
            timeline = earthToSurface(camera, handleAnimationComplete);
          }
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
