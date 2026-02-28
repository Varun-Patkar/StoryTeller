/**
 * Animation Utilities for StoryTeller
 * 
 * Provides GSAP constants, easing functions, and animation helpers.
 * Centralizes animation timing for consistent cinematic feel.
 */

/**
 * Animation duration constants (seconds)
 * Cinematic animations use longer durations for dramatic effect
 */
export const DURATIONS = {
  SPACE_TO_EARTH: 4.0, // Deep space → medium orbit: slow zoom for drama
  EARTH_TO_SURFACE: 3.0, // Medium orbit → close to surface: medium zoom
  SURFACE_TO_STORY: 2.5, // Surface → extreme close: fastest zoom
  RESUME_ANIMATION: 1.5, // Resume story: quick zoom
  EARTH_ROTATION: 360, // Full rotation duration (ms per cycle, handled per frame)
  UI_TRANSITION: 0.3, // UI fade/slide transitions
};

/**
 * GSAP easing presets for different animation types
 * All use power2/power3 curves for natural motion
 */
export const EASING = {
  // Smooth deceleration - good for incoming zoom animations
  EASE_IN_OUT: 'power2.inOut',
  // Smooth acceleration - good for outgoing animations
  EASE_OUT: 'power2.out',
  // Dramatic entrance
  EASE_IN: 'power2.in',
  // Extra smooth easing for very long animations
  SMOOTH_EASE: 'power3.out',
};

/**
 * Camera positioning constants for ThreeJS coordinate system
 * Convention: Z-axis = depth (distance from viewer)
 * +Z = away from viewer, -Z = toward viewer
 */
export const CAMERA_POSITIONS = {
  DEEP_SPACE: { x: 0, y: 0, z: 300 }, // Far away - Earth tiny
  MEDIUM_ORBIT: { x: 0, y: 0, z: 150 }, // Medium distance - Dashboard view
  CLOSE: { x: 0, y: 0, z: 50 }, // Close - Setup form view
  EXTREME_CLOSE: { x: 0, y: 0, z: 10 }, // Story reader - Earth fills most of screen
};

/**
 * Earth model opacity states for transitions
 */
export const EARTH_OPACITY = {
  VISIBLE: 1.0,
  FADING: 0.5,
  HIDDEN: 0,
};

/**
 * Helper: Create animation timeline with consistent settings
 * 
 * Usage:
 *   const tl = createAnimationTimeline();
 *   tl.to(camera.position, { z: 150, duration: 4, ease: EASING.EASE_OUT });
 *   tl.play();
 * 
 * @param {Object} options - GSAP timeline options
 * @returns {gsap.core.Timeline} Configured timeline
 */
export function createAnimationTimeline(options = {}) {
  return gsap.timeline({
    paused: false,
    ...options,
  });
}

/**
 * Helper: Animate camera zoom with easing
 * Convenience function for common zoom pattern
 * 
 * @param {THREE.Camera} camera - Three.js camera object
 * @param {Object} targetPosition - Target { x, y, z }
 * @param {number} duration - Animation duration (seconds)
 * @param {string} ease - GSAP easing string
 * @param {Function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Tween} Tween object for control
 */
export function animateCamera(
  camera,
  targetPosition,
  duration,
  ease = EASING.EASE_OUT,
  onComplete = null
) {
  return gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease,
    onComplete,
  });
}

/**
 * Helper: Fade object with THREE.js material opacity
 * 
 * @param {THREE.Mesh|THREE.Object3D} object - 3D object to fade
 * @param {number} targetOpacity - Target opacity 0-1
 * @param {number} duration - Animation duration (seconds)
 * @param {string} ease - GSAP easing
 * @param {Function} onComplete - Callback
 * @returns {gsap.core.Tween} Tween object
 */
export function fadeObject(
  object,
  targetOpacity,
  duration,
  ease = EASING.EASE_OUT,
  onComplete = null
) {
  return gsap.to(object.material, {
    opacity: targetOpacity,
    duration,
    ease,
    onComplete,
  });
}

/**
 * Helper: Rotate object around axis
 * Used for Earth's slow rotation in background
 * 
 * @param {THREE.Mesh} object - 3D object to rotate
 * @param {string} axis - 'x', 'y', or 'z'
 * @param {number} degrees - Total degrees to rotate
 * @param {number} duration - Animation duration (seconds)
 * 
 * @returns {gsap.core.Tween} Tween object
 */
export function rotateObject(object, axis, degrees, duration = 360) {
  const rotationObj = { rotation: 0 };

  return gsap.to(rotationObj, {
    rotation: degrees,
    duration,
    ease: 'none', // Linear rotation
    repeat: -1, // Infinite loop
    onUpdate: () => {
      object.rotation[axis] = (rotationObj.rotation * Math.PI) / 180;
    },
  });
}

/**
 * Helper: Check if any GSAP animations are running
 * Useful for preventing UI interactions during transitions
 * 
 * @returns {boolean} True if any timeline/tween is active
 */
export function isAnimating() {
  return gsap.globalTimeline.progress() > 0;
}

/**
 * Helper: Kill all running GSAP animations
 * Use for cleanup or emergency stops
 * 
 * @param {THREE.Object3D} scope - Optional: kill only animations on this object
 */
export function killAllAnimations(scope = null) {
  if (scope) {
    gsap.killTweensOf(scope);
  } else {
    gsap.globalTimeline.clear();
  }
}

export default {
  DURATIONS,
  EASING,
  CAMERA_POSITIONS,
  EARTH_OPACITY,
  createAnimationTimeline,
  animateCamera,
  fadeObject,
  rotateObject,
  isAnimating,
  killAllAnimations,
};
