import gsap from 'gsap';

/**
 * earthToSurface: Animate camera from Earth orbit toward surface
 * 
 * Transition: DASHBOARD → SETUP
 * Purpose: Zoom into Earth surface as user enters story configuration (planet moves right)
 * 
 * Animation Details:
 * - Duration: 1.2 seconds (faster approach feels purposeful)
 * - Easing: power2.out (smooth deceleration)
 * - Camera movement: [0,0,17] → [3,0,5]
 * - x: 0 → 3 (camera moves slightly left, planet appears on right side for UI composition)
 * - z: 17 → 5 (zoom extremely close to planet surface)
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function earthToSurface(camera, onComplete) {
  const timeline = gsap.timeline({ onComplete });
  timeline.to(camera.position, {
    x: 3, // Move camera left so planet appears on right side of screen
    z: 5,              // Very close Earth orbit
    duration: 1.2,
    ease: 'power2.out'
  });
  return timeline;
}
