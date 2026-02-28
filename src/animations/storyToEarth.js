import gsap from 'gsap';

/**
 * storyToEarth: Animate camera from story back to orbit
 * 
 * Transition: PLAYING → DASHBOARD or PLAYING → SETUP (back navigation)
 * Purpose: Reverse zoom from story close-up, restore Earth visibility
 * 
 * Animation Details:
 * - Duration: 1.5 seconds (matches surfaceToStory for symmetry)
 * - Easing: power2.inOut (smooth acceleration and deceleration)
 * - Camera movement: [0,0,1.3] → target position
 * - Earth opacity: 0 → 1 (restore Earth visibility)
 * - Fade happens first (0.3s), then camera zooms out
 * 
 * @param {THREE.Camera} camera - Three.js camera object to animate
 * @param {THREE.Group} earthModel - Earth group containing mesh to fade in
 * @param {Object} targetPosition - Target camera position {x, z}
 * @param {function} onComplete - Callback when animation finishes
 * @returns {gsap.core.Timeline} GSAP timeline (for cancellation support)
 */
export function storyToEarth(camera, earthModel, targetPosition, onComplete) {
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
  
  // First, restore Earth opacity
  if (meshToFade && meshToFade.material) {
    timeline.to(meshToFade.material, {
      opacity: 1,
      duration: 0.4,  // Quick fade in
      ease: 'power2.out'
    }, 0);  // Start immediately
  }

  // Then zoom camera out to target position
  timeline.to(camera.position, {
    x: targetPosition.x,
    z: targetPosition.z,
    duration: 1.5,
    ease: 'power2.inOut'
  }, 0.2);  // Start after 0.2s to let fade begin first

  return timeline;
}
