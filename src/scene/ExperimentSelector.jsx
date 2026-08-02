import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import useGameStore from '../store/gameStore';

const EXPERIMENTS = {
  chemistry: [
    { id: 'titration', label: 'Titration', color: '#06b6d4' },
    { id: 'flame-test', label: 'Flame Test', color: '#f97316' },
    { id: 'ph-test', label: 'pH Testing', color: '#10b981' },
    { id: 'precipitation', label: 'Precipitation', color: '#8b5cf6' },
    { id: 'iodine-clock', label: 'Iodine Clock', color: '#ec4899' },
    { id: 'salt-prep', label: 'Salt Preparation', color: '#eab308' },
    { id: 'electrolysis', label: 'Electrolysis', color: '#3b82f6' },
    { id: 'distillation', label: 'Distillation', color: '#14b8a6' },
  ],
  physics: [
    { id: 'circuit', label: 'Circuit Building', color: '#f97316' },
    { id: 'ohms-law', label: "Ohm's Law", color: '#06b6d4' },
    { id: 'pendulum', label: 'Simple Pendulum', color: '#10b981' },
    { id: 'projectile', label: 'Projectile Motion', color: '#ef4444' },
    { id: 'refraction', label: "Snell's Refraction", color: '#8b5cf6' },
    { id: 'induction', label: 'EM Induction', color: '#f59e0b' },
  ],
};

function SelectorButton({ position, label, color, isActive, onInteract }) {
  return (
    <group
      position={position}
      userData={{
        interactable: true,
        promptText: isActive ? `${label} (Active)` : `Switch to ${label}`,
        onInteract,
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.28, 0.06]} />
        <meshStandardMaterial
          color={isActive ? color : '#1e293b'}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Experiment Label */}
      <Text
        position={[0, 0, 0.032]} // slightly in front of the box surface
        fontSize={0.12}
        color="white"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {/* Active indicator dot */}
      {isActive && (
        <mesh position={[-0.8, 0, 0.04]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  );
}

export default function ExperimentSelector({ room, position }) {
  const activeExperiment = useGameStore((s) => s.activeExperiment);
  const setActiveExperiment = useGameStore((s) => s.setActiveExperiment);
  const openGuideModal = useGameStore((s) => s.openGuideModal);
  const experiments = EXPERIMENTS[room] || [];

  return (
    <group position={position}>
      {/* Panel background */}
      <mesh>
        <boxGeometry args={[2.2, experiments.length * 0.35 + 0.4, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Panel border glow */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.3, experiments.length * 0.35 + 0.5, 0.06]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive={room === 'chemistry' ? '#06b6d4' : '#f97316'}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Header bar */}
      <mesh position={[0, (experiments.length * 0.35) / 2 + 0.05, 0.05]}>
        <boxGeometry args={[2.0, 0.06, 0.02]} />
        <meshStandardMaterial
          color={room === 'chemistry' ? '#06b6d4' : '#f97316'}
          emissive={room === 'chemistry' ? '#06b6d4' : '#f97316'}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Experiment buttons */}
      {experiments.map((exp, i) => {
        const y = ((experiments.length - 1) / 2 - i) * 0.35;
        const isActive = activeExperiment === exp.id ||
          (!activeExperiment && i === 0); // Default to first experiment
        return (
          <SelectorButton
            key={exp.id}
            position={[0, y, 0.05]}
            label={exp.label}
            color={exp.color}
            isActive={isActive}
            onInteract={() => {
              setActiveExperiment(exp.id);
              openGuideModal(exp.id);
            }}
          />
        );
      })}
    </group>
  );
}
