import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

const METAL_COLORS = {
  Na: { color: '#ffcc00', name: 'Yellow' },
  Cu: { color: '#00cc66', name: 'Green' },
  K:  { color: '#cc88ff', name: 'Lilac' },
  Ca: { color: '#ff4400', name: 'Orange-Red' },
  Li: { color: '#ff0044', name: 'Crimson' },
};

// ── Bunsen Burner ──
function BunsenBurner({ position, flameColor, flameActive }) {
  const flameRef = useRef();
  const glowRef = useRef();

  useFrame((_, delta) => {
    if (flameRef.current) {
      // Flickering effect
      const flicker = 0.8 + Math.sin(Date.now() * 0.02) * 0.15 + Math.sin(Date.now() * 0.05) * 0.05;
      flameRef.current.scale.set(1, flicker, 1);
      flameRef.current.material.emissiveIntensity = flameActive ? 1.5 + Math.sin(Date.now() * 0.03) * 0.5 : 0.6;
    }
    if (glowRef.current) {
      glowRef.current.intensity = flameActive
        ? 3 + Math.sin(Date.now() * 0.015) * 1
        : 1.5 + Math.sin(Date.now() * 0.01) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 12]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Barrel */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.16, 10]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Air hole ring */}
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.03, 0.005, 8, 16]} />
        <meshStandardMaterial color="#444" metalness={0.8} />
      </mesh>
      {/* Flame — cone shape */}
      <mesh ref={flameRef} position={[0, 0.24, 0]}>
        <coneGeometry args={[0.04, 0.14, 8]} />
        <meshStandardMaterial
          color={flameColor}
          emissive={flameColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner flame */}
      <mesh position={[0, 0.22, 0]}>
        <coneGeometry args={[0.02, 0.08, 8]} />
        <meshStandardMaterial
          color="#88ccff"
          emissive="#4488ff"
          emissiveIntensity={flameActive ? 0.3 : 0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* Glow light */}
      <pointLight
        ref={glowRef}
        position={[0, 0.28, 0]}
        color={flameColor}
        intensity={2}
        distance={3}
      />
    </group>
  );
}

// ── Sample Dish ──
function SampleDish({ position, metalId, label, onPick, canPick }) {
  const metalColor = METAL_COLORS[metalId]?.color || '#888';
  return (
    <group
      position={position}
      userData={canPick ? {
        interactable: true,
        promptText: `Pick up ${label} (${metalId}) sample`,
        onInteract: onPick,
      } : {}}
    >
      {/* Small dish */}
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.015, 12]} />
        <meshStandardMaterial color="#ddd" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Sample powder */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.008, 12]} />
        <meshStandardMaterial color={metalColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Main Component ──
export default function FlameTestExperiment({ tablePos }) {
  const flameTest = useGameStore((s) => s.flameTest);
  const heldItem = useGameStore((s) => s.heldItem);
  const pickSample = useGameStore((s) => s.pickSample);
  const activateFlame = useGameStore((s) => s.activateFlame);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetFlameTest = useGameStore((s) => s.resetFlameTest);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const handleSubmit = async () => {
    const state = useGameStore.getState().flameTest;
    const correct = state.studentGuess === state.selectedSample;
    const finalState = {
      experimentType: 'flame-test',
      sampleTested: state.selectedSample,
      colorObserved: METAL_COLORS[state.selectedSample]?.name || 'Unknown',
      studentGuess: state.studentGuess,
      correct,
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetFlameTest();
    } catch (err) {
      console.error('Flame test report failed:', err);
    }
  };

  const metals = ['Na', 'Cu', 'K', 'Ca', 'Li'];
  const canPickSample = !heldItem && !flameTest.flameActive && !flameTest.submitted;
  const canTestFlame = heldItem?.startsWith('sample-') && !flameTest.flameActive;

  return (
    <group>
      {/* Bunsen Burner on table */}
      <group
        userData={canTestFlame ? {
          interactable: true,
          promptText: 'Hold sample over flame',
          onInteract: activateFlame,
        } : {}}
      >
        <BunsenBurner
          position={[tablePos[0], 0.95, tablePos[2]]}
          flameColor={flameTest.flameActive ? flameTest.flameColor : '#3388ff'}
          flameActive={flameTest.flameActive}
        />
      </group>

      {/* Sample tray */}
      <group position={[tablePos[0] + 1.5, 0.96, tablePos[2] + 0.3]}>
        {/* Tray base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.02, 0.25]} />
          <meshStandardMaterial color="#4a4035" roughness={0.5} />
        </mesh>
        {metals.map((metal, i) => (
          <SampleDish
            key={metal}
            position={[-0.48 + i * 0.24, 0.02, 0]}
            metalId={metal}
            label={metal}
            canPick={canPickSample}
            onPick={() => pickSample(metal)}
          />
        ))}
      </group>

      {/* 3D Metal Ion Guess Buttons on Table (Aim Crosshair + Press E) */}
      {flameTest.flameActive && (
        <group position={[tablePos[0] - 1.2, 0.97, tablePos[2] + 0.3]}>
          {metals.map((metal, i) => {
            const isSelected = flameTest.studentGuess === metal;
            return (
              <group
                key={metal}
                position={[-0.48 + i * 0.24, 0.02, 0]}
                userData={{
                  interactable: true,
                  promptText: `Select ${metal} (${METAL_COLORS[metal]?.name} flame) as guess`,
                  onInteract: () => useGameStore.getState().setFlameGuess(metal),
                }}
              >
                <mesh castShadow>
                  <boxGeometry args={[0.2, 0.04, 0.12]} />
                  <meshStandardMaterial
                    color={isSelected ? '#06b6d4' : '#1e293b'}
                    emissive={METAL_COLORS[metal]?.color}
                    emissiveIntensity={isSelected ? 0.8 : 0.2}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Submit button (after flame test done and guess selected) */}
      {flameTest.flameActive && flameTest.studentGuess && !flameTest.submitted && (
        <group
          position={[tablePos[0] - 1.2, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: `Submit ${flameTest.studentGuess} Flame Test ✓`,
            onInteract: handleSubmit,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.08, 0.15]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}
