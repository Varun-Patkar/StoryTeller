import gsap from 'gsap';

/**
 * surfaceToStory: Animate camera into story reading interface
 * 
 * Transition: SETUP → PLAYING
 * Purpose: Final zoom into story world centered on planet, fade Earth as story UI takes over
 * 
 * Animation Details:
 * - Duration: 1.5 seconds (measured approach)
 * - Easing: power2.inOut (smooth acceleration and deceleration)
 * - Camera movement: [3,0,5] → [0,0,1]
 * - x: 3 → 0 (pan left to center as we zoom extremely close)
 * - z: 5 → 1 (almost touching planet surface before fade)
 * - Fade animation: Starts after 0.9s (lets camera get extremely close first)
 * - Parallel animation: Earth model opacity 1 → 0 (fade out after delay)
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {THREE.Group} earthModel - Earth group containing mesh to fade out
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function surfaceToStory(camera, earthModel, onComplete) {
  // Find the mesh inside the group (first child that is a mesh)
  let meshToFade = null;
  if (earthModel) {
    earthModel.traverse((child) => {
      if (child.isMesh && !meshToFade) {
        meshToFade = child;
      }
    });
  }

  const timeline = gsap.timeline({ onComplete });
  
  // Camera zoom to extreme close-up and center on planet (fills entire screen)
  // x: -15 → 0 smoothly pans planet from right to center as we zoom extremely close
  timeline.to(camera.position, {
    x: 0,               // Center on planet when filling entire screen
    z: 1.3,               // Almost touching surface
    duration: 1.5,
    ease: 'power2.inOut'
  }, 0);  // Start at time 0

  // Only animate mesh opacity if we found a mesh
  // Start fade after 0.9s so camera gets extremely close first
  if (meshToFade && meshToFade.material) {
    timeline.to(meshToFade.material, {
      opacity: 0,
      duration: 0.6,  // Fade takes 0.6s
      ease: 'power2.in',
      transparent: true  // Ensure material is set to transparent
    }, 0.9);  // Start at 0.9s (after camera has moved very close)
  }

  return timeline;
}
