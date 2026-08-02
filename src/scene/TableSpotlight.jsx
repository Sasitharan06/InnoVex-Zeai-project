import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const EXP_COLORS = {
  // Chemistry
  'titration': '#06b6d4',
  'flame-test': '#f97316',
  'ph-test': '#10b981',
  'precipitation': '#38bdf8',
  'iodine-clock': '#38bdf8',
  'salt-prep': '#eab308',
  'electrolysis': '#3b82f6',
  'distillation': '#14b8a6',
  // Physics
  'circuit': '#f97316',
  'ohms-law': '#06b6d4',
  'pendulum': '#10b981',
  'projectile': '#ef4444',
  'refraction': '#8b5cf6',
  'induction': '#f59e0b',
};

export default function TableSpotlight({ tablePos, activeExp }) {
  const spotlightRef = useRef();
  const targetRef = useRef();
  const coneRef = useRef();

  const color = EXP_COLORS[activeExp] || '#38bdf8';

  useFrame(() => {
    if (coneRef.current) {
      // Subtle pulse to give atmosphere
      coneRef.current.material.opacity = 0.15 + Math.sin(Date.now() * 0.003) * 0.03;
    }
  });

  return (
    <group>
      {/* Target object on table surface */}
      <object3D ref={targetRef} position={[tablePos[0], 0.95, tablePos[2]]} />

      {/* Ceiling Mount Cable */}
      <mesh position={[tablePos[0], 3.1, tablePos[2]]}>
        <cylinderGeometry args={[0.008, 0.008, 0.7, 8]} />
        <meshStandardMaterial color="#333" metalness={0.8} />
      </mesh>

      {/* Lamp Shade (Pendant Fixture) */}
      <mesh position={[tablePos[0], 2.75, tablePos[2]]} castShadow>
        <coneGeometry args={[0.25, 0.2, 16]} rotation={[Math.PI, 0, 0]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Glowing Light Bulb inside Shade */}
      <mesh position={[tablePos[0], 2.72, tablePos[2]]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
      </mesh>

      {/* Volumetric Light Beam Cone Mesh */}
      <mesh ref={coneRef} position={[tablePos[0], 1.85, tablePos[2]]}>
        <coneGeometry args={[1.1, 1.8, 24, 1, true]} rotation={[Math.PI, 0, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Table Surface Light Circle Glow */}
      <mesh position={[tablePos[0], 0.952, tablePos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* R3F Focused SpotLight casting real light & shadows on apparatus */}
      <spotLight
        ref={spotlightRef}
        position={[tablePos[0], 2.7, tablePos[2]]}
        target={targetRef.current || undefined}
        color={color}
        intensity={5}
        distance={8}
        angle={Math.PI / 4}
        penumbra={0.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Secondary fill point light */}
      <pointLight
        position={[tablePos[0], 2.0, tablePos[2]]}
        color={color}
        intensity={1.8}
        distance={4}
      />
    </group>
  );
}
