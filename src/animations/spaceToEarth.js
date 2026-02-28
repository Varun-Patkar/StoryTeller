import gsap from 'gsap';

/**
 * spaceToEarth: Animate camera from deep space toward Earth orbit
 * 
 * Transition: SELECTING_SOURCE → DASHBOARD
 * Purpose: Cinematic zoom revealing Earth as centered destination
 * 
 * Animation Details:
 * - Duration: 1.5 seconds (fast approach for testing)
 * - Easing: power2.out (smooth deceleration for cinematic feel)
 * - Camera movement: [0,0,300] → [0,0,17]
 * - x: 0 (centered)
 * - z: 17 places viewer close enough to see Earth well, centered in frame
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function spaceToEarth(camera, onComplete) {
  const timeline = gsap.timeline({ onComplete });
  timeline.to(camera.position, {
    x: 14,               // Center dashboard view
    z: 17,              // Much closer to Earth
    duration: 1.5,
    ease: 'power2.out'
  });
  return timeline;
}
