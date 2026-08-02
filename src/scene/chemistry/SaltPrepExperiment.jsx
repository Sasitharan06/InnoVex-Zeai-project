import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

export default function SaltPrepExperiment({ tablePos }) {
  const saltPrep = useGameStore((s) => s.saltPrep);
  const startSaltHeating = useGameStore((s) => s.startSaltHeating);
  const setSaltProgress = useGameStore((s) => s.setSaltProgress);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetSaltPrep = useGameStore((s) => s.resetSaltPrep);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const flameRef = useRef();

  useFrame((_, delta) => {
    if (saltPrep.heated && saltPrep.heatProgress < 1) {
      const p = Math.min(saltPrep.heatProgress + delta * 0.25, 1);
      setSaltProgress(p);
    }
    if (flameRef.current) {
      flameRef.current.scale.set(1, 0.8 + Math.sin(Date.now() * 0.02) * 0.2, 1);
    }
  });

  const handleSubmit = async () => {
    const finalState = {
      experimentType: 'salt-prep',
      solutionHeated: saltPrep.heated,
      crystalsFormed: saltPrep.crystalsFormed,
      heatProgress: (saltPrep.heatProgress * 100).toFixed(0) + '%',
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', saltPrep.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetSaltPrep();
    } catch (err) {
      console.error('Salt prep report failed:', err);
    }
  };

  const liquidLevel = 1 - saltPrep.heatProgress * 0.9;

  return (
    <group>
      {/* Tripod Stand */}
      <group position={[tablePos[0], 0.96, tablePos[2]]}>
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.12, 0.01, 8, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#333" metalness={0.8} />
        </mesh>
        {/* Wire Gauze */}
        <mesh position={[0, 0.205, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.005, 16]} />
          <meshStandardMaterial color="#aaa" wireframe />
        </mesh>
        {/* Tripod legs */}
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
          <mesh key={i} position={[Math.sin(angle) * 0.1, 0.1, Math.cos(angle) * 0.1]} rotation={[0, angle, 0.15]}>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
            <meshStandardMaterial color="#444" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Bunsen Burner under tripod */}
      <group
        position={[tablePos[0], 0.96, tablePos[2]]}
        userData={!saltPrep.heated ? {
          interactable: true,
          promptText: 'Light Bunsen Burner to heat salt solution',
          onInteract: startSaltHeating,
        } : {}}
      >
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.06, 10]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
        {saltPrep.heated && (
          <mesh ref={flameRef} position={[0, 0.12, 0]}>
            <coneGeometry args={[0.03, 0.1, 8]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* Evaporating Dish on Gauze */}
      <group position={[tablePos[0], 1.18, tablePos[2]]}>
        <mesh castShadow>
          <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} rotation={[Math.PI, 0, 0]} />
          <meshStandardMaterial color="#f5f5e8" roughness={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* Salt solution liquid */}
        {liquidLevel > 0.1 && (
          <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.08 * liquidLevel, 16]} />
            <meshStandardMaterial color="#06b6d4" transparent opacity={0.5} />
          </mesh>
        )}

        {/* Salt Crystals forming on dish as liquid evaporates */}
        {saltPrep.heatProgress > 0.3 && (
          <group position={[0, -0.03, 0]}>
            {Array.from({ length: 12 }).map((_, i) => (
              <mesh
                key={i}
                position={[
                  Math.sin(i * 0.5) * 0.06 * saltPrep.heatProgress,
                  0.005,
                  Math.cos(i * 0.5) * 0.06 * saltPrep.heatProgress,
                ]}
                scale={[saltPrep.heatProgress, saltPrep.heatProgress, saltPrep.heatProgress]}
              >
                <boxGeometry args={[0.012, 0.012, 0.012]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* Submit button */}
      {saltPrep.crystalsFormed && !saltPrep.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Collect Salt Crystals ✓',
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
