import { useRef } from 'react';
import EarthModel from './EarthModel';
import Background from './Background';
import { usePhaseTransition } from '@/services/usePhaseTransition';

/**
 * Scene: Main Three.js scene component
 * 
 * Renders:
 * - Lighting (ambient + directional for 3D effect)
 * - Camera positioned initially at deep space (0, 0, 300)
 * - Background starfield
 * - Earth model with rotation
 * - Triggers camera animations on phase transitions via usePhaseTransition hook
 * 
 * Animation Hooks:
 * - usePhaseTransition monitors state changes and executes GSAP camera animations
 * - Earth model rotates continuously via useFrame in EarthModel component
 */
export default function Scene() {
  const earthModelRef = useRef();

  // Trigger camera animations on phase transitions (pass ref object, not ref.current)
  usePhaseTransition(earthModelRef);

  return (
    <>
      {/* Lighting Setup */}
      {/* Ambient light: Soft overall illumination for scene visibility */}
      <ambientLight intensity={0.6} />

      {/* Directional light: Sun-like light for 3D depth on Earth */}
      <directionalLight position={[10, 10, 10]} intensity={1.2} />

      {/* Point light: Additional fill light for detail */}
      <pointLight position={[-10, 10, -10]} intensity={0.4} />

      {/* Background: Starfield or space gradient effect */}
      <Background />

      {/* Earth Model: 3D GLB model with rotation */}
      <EarthModel ref={earthModelRef} />
    </>
  );
}
