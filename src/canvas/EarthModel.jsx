import { useRef, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * EarthModel: Renders 3D Earth from GLB file
 * 
 * Generated from gltfjsx tool
 * Loads geometry and materials from /earth-like/source/Untitled.glb
 * Rotates counter-clockwise around Y axis (0.0005 rad/frame)
 * Initial rotation: 90 degrees counter-clockwise (Math.PI / 2 radians)
 */
const EarthModel = forwardRef(function EarthModel(props, ref) {
  const groupRef = useRef();
  
  // Load GLB and destructure nodes + materials
  const { nodes, materials } = useGLTF('/earth-like/source/Untitled.glb');

  // Rotate Earth continuously around Y axis for cinematic effect (counter-clockwise)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= 0.0005;  // Negative for counter-clockwise
    }
  });

  // Use provided ref if available, otherwise use internal ref
  const finalRef = ref || groupRef;

  return (
    <group 
      ref={finalRef} 
      {...props} 
      dispose={null}
      rotation={[0, -Math.PI / 2, 0]}  // Initial 90 degree rotation counter-clockwise
    >
      <mesh geometry={nodes.Sphere.geometry} material={materials['Procedural Earth']} />
    </group>
  );
});

// Preload GLB to avoid loading delays during transitions
useGLTF.preload('/earth-like/source/Untitled.glb');

export default EarthModel;
