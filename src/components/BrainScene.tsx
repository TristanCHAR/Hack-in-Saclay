import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-ignore — pnpm symlinks prevent TS from resolving @types/three
import * as THREE from 'three';

/* ── Particle Brain Cloud ── */
const BrainParticles: React.FC<{ stability: number; dataCount: number }> = ({
  stability,
  dataCount,
}) => {
  const ref = useRef<any>();

  const positions = useMemo(() => {
    const count = Math.max(600, dataCount * 40);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const baseR = 1.4 + (Math.random() - 0.5) * 0.4;
      pos[i * 3] = baseR * Math.sin(phi) * Math.cos(theta) * 1.3;
      pos[i * 3 + 1] = baseR * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = baseR * Math.cos(phi) * 0.95;
    }
    return pos;
  }, [dataCount]);

  const color = useMemo(() => {
    if (stability > 65) return '#4facfe';
    if (stability > 35) return '#FFA726';
    return '#FF6B6B';
  }, [stability]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.003;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.025;
    ref.current.scale.setScalar(s);
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

/* ── Orbiting Data Ring ── */
const DataRing: React.FC<{
  radius: number;
  speed: number;
  color: string;
  tilt: number;
  count: number;
}> = ({ radius, speed, color, tilt, count }) => {
  const ref = useRef<any>();

  const positions = useMemo(() => {
    const pts = Math.max(30, count);
    const pos = new Float32Array(pts * 3);
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 2] = Math.sin(a) * radius;
    }
    return pos;
  }, [radius, count]);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y += speed;
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <Points ref={ref} positions={positions} stride={3}>
        <PointMaterial
          transparent
          color={color}
          size={0.06}
          sizeAttenuation
          depthWrite={false}
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
};

/* ── Exported Scene ── */
interface BrainSceneProps {
  stability: number;
  dataCount: number;
  criseCount: number;
  drugCount: number;
  flashPopCount: number;
}

const BrainScene: React.FC<BrainSceneProps> = ({
  stability,
  dataCount,
  criseCount,
  drugCount,
  flashPopCount,
}) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.3} />
      <BrainParticles stability={stability} dataCount={dataCount} />
      <DataRing radius={2.2} speed={0.005} color="#4facfe" tilt={0.3} count={drugCount * 5 + 30} />
      <DataRing radius={2.5} speed={-0.003} color="#9C7CFF" tilt={-0.5} count={flashPopCount * 5 + 30} />
      <DataRing radius={2.8} speed={0.004} color="#FF6B6B" tilt={0.8} count={criseCount * 8 + 20} />
    </Canvas>
  );
};

export default BrainScene;
