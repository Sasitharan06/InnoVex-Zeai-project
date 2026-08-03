import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

export default function DistillationExperiment({ tablePos }) {
  const distillation = useGameStore((s) => s.distillation);
  const startDistillation = useGameStore((s) => s.startDistillation);
  const setDistillateVolume = useGameStore((s) => s.setDistillateVolume);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetDistillation = useGameStore((s) => s.resetDistillation);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const steamRef = useRef();

  useFrame((_, delta) => {
    if (distillation.heating && distillation.distillateVolume < 1) {
      setDistillateVolume(Math.min(distillation.distillateVolume + delta * 0.1, 1));
    }
    if (steamRef.current && distillation.heating) {
      steamRef.current.position.y += delta * 0.1;
      if (steamRef.current.position.y > 0.15) steamRef.current.position.y = 0.05;
    }
  });

  const handleSubmit = async () => {
    const finalState = {
      experimentType: 'distillation',
      heating: distillation.heating,
      distillateVolume: (distillation.distillateVolume * 50).toFixed(1) + ' mL',
      purityAchieved: '98%',
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', distillation.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetDistillation();
    } catch (err) {
      console.error('Distillation report failed:', err);
    }
  };

  return (
    <group>
      {/* Heating Mantle / Bunsen Burner + Distillation Flask (Round Bottom) */}
      <group position={[tablePos[0] - 0.6, 0.96, tablePos[2]]}>
        {/* Heating Base */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.08, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
        {distillation.heating && (
          <pointLight position={[0, 0.08, 0]} color="#f97316" intensity={2} distance={1} />
        )}

        {/* Round Bottom Flask */}
        <group
          position={[0, 0.18, 0]}
          userData={!distillation.heating ? {
            interactable: true,
            promptText: 'Turn ON heating mantle to distill solution',
            onInteract: startDistillation,
          } : {}}
        >
          {/* Flask Sphere Body */}
          <mesh castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.25} roughness={0.05} transmission={0.8} />
          </mesh>
          {/* Flask Neck */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.1, 12]} />
            <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.25} transmission={0.8} />
          </mesh>
          {/* Liquid mixture inside */}
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.095 * (1 - distillation.distillateVolume * 0.4), 16, 16]} />
            <meshStandardMaterial color="#8b5cf6" transparent opacity={0.6} />
          </mesh>

          {/* Vapor / Steam inside neck */}
          {distillation.heating && (
            <mesh ref={steamRef} position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.04, 8]} />
              <meshStandardMaterial color="#e0f2fe" transparent opacity={0.5} />
            </mesh>
          )}
        </group>
      </group>

      {/* Condenser Tube (Angled cylinder connecting flask to receiver) */}
      <group position={[tablePos[0], 1.15, tablePos[2]]} rotation={[0, 0, -0.4]}>
        {/* Outer Cooling Jacket */}
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.6, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.3} transmission={0.7} />
        </mesh>
        {/* Inner Condenser Tube */}
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, 0.62, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.4} transmission={0.85} />
        </mesh>
      </group>

      {/* Receiving Flask (Erlenmeyer) */}
      <group position={[tablePos[0] + 0.6, 0.96, tablePos[2]]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.09, 0.16, 12]} position={[0, 0.08, 0]} />
          <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.25} transmission={0.8} />
        </mesh>
        {/* Pure Distillate Liquid Collected */}
        {distillation.distillateVolume > 0 && (
          <mesh position={[0, 0.03 + distillation.distillateVolume * 0.03, 0]}>
            <cylinderGeometry args={[0.025, 0.08, 0.06 * distillation.distillateVolume, 12]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.7} />
          </mesh>
        )}
      </group>

      {/* Submit button */}
      {distillation.distillateVolume > 0.5 && !distillation.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Collect Purified Distillate ✓',
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
