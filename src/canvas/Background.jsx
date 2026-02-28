import { useMemo } from 'react';

const STAR_COUNT = 1400;
const EARTH_EXCLUSION_RADIUS = 35;
const STAR_FIELD_WIDTH = 900;
const STAR_FIELD_HEIGHT = 700;
const STAR_MIN_Z = -450;
const STAR_MAX_Z = 360;

/**
 * Background: Deep space gradient and randomized starfield
 *
 * Generates stars in front of and behind Earth while keeping a clear
 * exclusion zone around Earth so no stars intersect the planet.
 */
export default function Background() {
  const starPositions = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i += 1) {
      let x = 0;
      let y = 0;
      let z = 0;
      let distanceFromCenter = 0;

      do {
        x = (Math.random() - 0.5) * STAR_FIELD_WIDTH;
        y = (Math.random() - 0.5) * STAR_FIELD_HEIGHT;
        z = STAR_MIN_Z + Math.random() * (STAR_MAX_Z - STAR_MIN_Z);
        distanceFromCenter = Math.sqrt((x * x) + (y * y) + (z * z));
      } while (distanceFromCenter < EARTH_EXCLUSION_RADIUS);

      const index = i * 3;
      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
    }

    return positions;
  }, []);

  return (
    <>
      {/* Background sphere: Deep space color */}
      <mesh position={[0, 0, -100]}>
        <sphereGeometry args={[500, 64, 64]} />
        <meshBasicMaterial color={0x0a0e27} wireframe={false} />
      </mesh>

      {/* Randomized stars: beyond Earth and up to behind initial camera */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={starPositions} count={starPositions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={0xffffff} size={1.2} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
      </points>
    </>
  );
}
