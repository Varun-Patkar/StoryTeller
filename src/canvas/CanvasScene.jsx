import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';

/**
 * CanvasScene: Wraps three.js Canvas in isolated module
 * 
 * Initial camera position at deep space (0, 0, 300) for boot sequence.
 * Will animate via GSAP on phase transitions.
 */
export default function CanvasScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 300], far: 5000 }}
      className="absolute top-0 left-0 z-0 pointer-events-none"
      gl={{ antialias: true, alpha: true, depth: true, stencil: false }}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
