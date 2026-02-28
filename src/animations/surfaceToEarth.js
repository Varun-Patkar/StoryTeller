import gsap from 'gsap';

/**
 * surfaceToEarth: Animate camera from surface back to orbit
 * 
 * Transition: SETUP → DASHBOARD (back button)
 * Purpose: Reverse zoom out from surface to orbit when user returns to dashboard
 * 
 * Animation Details:
 * - Duration: 1.2 seconds (same as earthToSurface for consistency)
 * - Easing: power2.out (smooth deceleration)
 * - Camera movement: [3,0,5] → [12.5,0,17]
 * - x: 3 → 12.5 (camera moves back to dashboard position)
 * - z: 5 → 17 (zoom out to medium Earth orbit)
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function surfaceToEarth(camera, onComplete) {
  const timeline = gsap.timeline({ onComplete });
  timeline.to(camera.position, {
    x: 12.5,  // Back to dashboard camera position
    z: 17,    // Back to medium orbit
    duration: 1.2,
    ease: 'power2.out'
  });
  return timeline;
}
