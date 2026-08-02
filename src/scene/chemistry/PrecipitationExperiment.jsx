import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

// ── Pouring Liquid Stream Animation ──
function PouringStream({ position, color }) {
  const streamRef = useRef();
  useFrame(() => {
    if (streamRef.current) {
      streamRef.current.rotation.y += 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh ref={streamRef} position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.35, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── Beaker Model ──
function Beaker({ position, label, liquidColor, liquidLevel = 0.7, canPour, onPour, isEmpty }) {
  return (
    <group
      position={position}
      userData={canPour ? {
        interactable: true,
        promptText: `Pour ${label} into mixing beaker`,
        onInteract: onPour,
      } : {}}
    >
      {/* Glass body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.3, 16]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} transmission={0.9} />
      </mesh>
      {/* Spout */}
      <mesh position={[0.12, 0.15, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.04, 0.02, 0.04]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} transmission={0.9} />
      </mesh>

      {/* Liquid inside beaker */}
      {!isEmpty && (
        <group>
          <mesh position={[0, -0.14 + liquidLevel * 0.11, 0]}>
            <cylinderGeometry args={[0.115, 0.10, 0.22 * liquidLevel, 16]} />
            <meshStandardMaterial color={liquidColor} transparent opacity={0.8} emissive={liquidColor} emissiveIntensity={0.35} />
          </mesh>
          {/* Meniscus surface */}
          <mesh position={[0, -0.14 + liquidLevel * 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.115, 16]} />
            <meshStandardMaterial color={liquidColor} transparent opacity={0.9} emissive={liquidColor} emissiveIntensity={0.45} />
          </mesh>
        </group>
      )}

      {/* Graduation marks */}
      {[0.3, 0.5, 0.7].map((y, i) => (
        <mesh key={i} position={[0.125, -0.14 + y * 0.3, 0]}>
          <boxGeometry args={[0.012, 0.002, 0.025]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}

// ── Central Reaction Mixing Beaker ──
function MixingBeaker({ position, liquidColor, liquidLevel, opacity, precipitateFormed, mixProgress }) {
  return (
    <group position={position}>
      {/* Glass body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.36, 16]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} transmission={0.9} />
      </mesh>

      {/* Liquid inside */}
      {liquidLevel > 0 && (
        <group>
          <mesh position={[0, -0.18 + liquidLevel * 0.16, 0]}>
            <cylinderGeometry args={[0.16, 0.14, 0.3 * liquidLevel, 16]} />
            <meshStandardMaterial
              color={liquidColor}
              transparent
              opacity={opacity}
              emissive={liquidColor}
              emissiveIntensity={precipitateFormed ? 0.8 : 0.2}
            />
          </mesh>

          {/* Meniscus top surface */}
          <mesh position={[0, -0.18 + liquidLevel * 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 16]} />
            <meshStandardMaterial
              color={liquidColor}
              transparent
              opacity={opacity}
              emissive={liquidColor}
              emissiveIntensity={precipitateFormed ? 0.9 : 0.3}
            />
          </mesh>

          {/* Solid White AgCl Precipitate Mesh Cloud & Particles inside */}
          {precipitateFormed && (
            <group position={[0, -0.12, 0]} scale={[mixProgress, mixProgress, mixProgress]}>
              {/* Dense solid white precipitate cake */}
              <mesh position={[0, 0.04, 0]}>
                <cylinderGeometry args={[0.13, 0.12, 0.08, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} emissive="#ffffff" emissiveIntensity={1.2} />
              </mesh>
              {/* Glowing reaction point light inside beaker */}
              <pointLight position={[0, 0.05, 0]} color="#ffffff" intensity={4} distance={2} />
              {/* Suspended precipitate particles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <mesh
                  key={i}
                  position={[
                    Math.sin(i * 0.8) * 0.08,
                    Math.sin(i * 0.5) * 0.06 + 0.04,
                    Math.cos(i * 0.8) * 0.08,
                  ]}
                >
                  <sphereGeometry args={[0.012, 8, 8]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      )}
    </group>
  );
}

// ── Main Component ──
export default function PrecipitationExperiment({ tablePos }) {
  const precipitation = useGameStore((s) => s.precipitation);
  const heldItem = useGameStore((s) => s.heldItem);
  const pourBeaker = useGameStore((s) => s.pourBeaker);
  const setPrecipitationProgress = useGameStore((s) => s.setPrecipitationProgress);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetPrecipitation = useGameStore((s) => s.resetPrecipitation);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  // Animate precipitate forming
  useFrame((_, delta) => {
    if (precipitation.precipitateFormed && precipitation.mixProgress < 1) {
      const newProgress = Math.min(precipitation.mixProgress + delta * 0.5, 1);
      setPrecipitationProgress(newProgress);
    }
  });

  const handleSubmit = async () => {
    const state = useGameStore.getState().precipitation;
    const finalState = {
      experimentType: 'precipitation',
      reactants: ['AgNO3', 'NaCl'],
      precipitateFormed: state.precipitateFormed,
      colorResult: state.colorResult,
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetPrecipitation();
    } catch (err) {
      console.error('Precipitation report failed:', err);
    }
  };

  // Mix liquid color: clear aqueous cyan -> dense opaque chalky white precipitate
  const mixColor = precipitation.precipitateFormed ? '#ffffff' : '#38bdf8';
  const mixOpacity = precipitation.precipitateFormed
    ? 0.98
    : (precipitation.beakerAAdded || precipitation.beakerBAdded ? 0.65 : 0);

  const liquidLevel = (precipitation.beakerAAdded ? 0.4 : 0) + (precipitation.beakerBAdded ? 0.4 : 0);

  const canPourA = !precipitation.beakerAAdded && !precipitation.submitted;
  const canPourB = !precipitation.beakerBAdded && precipitation.beakerAAdded && !precipitation.submitted;

  return (
    <group>
      {/* Beaker A — AgNO₃ (Aqueous Sky Blue) */}
      <Beaker
        position={[tablePos[0] - 0.7, 0.97, tablePos[2] + 0.4]}
        label="Solution A (AgNO₃)"
        liquidColor="#38bdf8"
        canPour={canPourA}
        onPour={() => pourBeaker('A')}
        isEmpty={precipitation.beakerAAdded}
      />

      {/* Beaker B — NaCl (Aqueous Cyan) */}
      <Beaker
        position={[tablePos[0] + 0.7, 0.97, tablePos[2] + 0.4]}
        label="Solution B (NaCl)"
        liquidColor="#06b6d4"
        canPour={canPourB}
        onPour={() => pourBeaker('B')}
        isEmpty={precipitation.beakerBAdded}
      />

      {/* Mixing Beaker */}
      <MixingBeaker
        position={[tablePos[0], 0.97, tablePos[2]]}
        liquidColor={mixColor}
        liquidLevel={liquidLevel}
        opacity={mixOpacity}
        precipitateFormed={precipitation.precipitateFormed}
        mixProgress={precipitation.mixProgress}
      />

      {/* Submit button */}
      {precipitation.precipitateFormed && precipitation.mixProgress > 0.6 && !precipitation.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Submit Precipitation Result ✓',
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
