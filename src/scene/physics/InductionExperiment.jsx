import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

export default function InductionExperiment({ tablePos }) {
  const induction = useGameStore((s) => s.induction);
  const pushInductionMagnet = useGameStore((s) => s.pushInductionMagnet);
  const stopInductionMagnet = useGameStore((s) => s.stopInductionMagnet);
  const setInductionThrustSpeed = useGameStore((s) => s.setInductionThrustSpeed);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetInduction = useGameStore((s) => s.resetInduction);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const needleRef = useRef();

  useFrame(() => {
    if (needleRef.current) {
      const targetAngle = induction.deflection * (Math.PI * 0.38);
      needleRef.current.rotation.z = THREE.MathUtils.lerp(
        needleRef.current.rotation.z,
        targetAngle,
        0.18
      );
    }
  });

  const handleSubmit = async () => {
    const state = useGameStore.getState().induction;
    const finalState = {
      experimentType: 'induction',
      faradaysLawVerified: true,
      readings: state.readings,
      thrustSpeed: state.thrustSpeed,
      inducedEMF: 'Proportional to rate of magnetic flux change (-N dΦ/dt)',
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetInduction();
    } catch (err) {
      console.error('Induction report failed:', err);
    }
  };

  const magnetX = tablePos[0] - 0.4 + induction.magnetPos * 0.4;
  const liveCurrent = induction.currentMA || 0;

  const cycleSpeed = () => {
    const nextSpeed = induction.thrustSpeed === 0.5 ? 1.0 : (induction.thrustSpeed === 1.0 ? 2.0 : 0.5);
    setInductionThrustSpeed(nextSpeed);
  };

  return (
    <group>
      {/* Solenoid Coil Tube */}
      <group position={[tablePos[0], 1.02, tablePos[2]]}>
        {/* Hollow Tube */}
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 16]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#334155" roughness={0.3} />
        </mesh>
        {/* Dense Copper Winding Coils (N=30 turns) */}
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[-0.12 + i * 0.016, 0, 0]}>
            <torusGeometry args={[0.072, 0.006, 8, 16]} />
            <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
      </group>

      {/* ── Magnetic Field Flux Lines around Bar Magnet ── */}
      <group position={[magnetX, 1.02, tablePos[2]]}>
        {/* North Pole (Red) */}
        <mesh position={[0.06, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.05, 0.05]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.2} />
        </mesh>
        {/* South Pole (Blue) */}
        <mesh position={[-0.06, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.05, 0.05]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
        </mesh>

        {/* 3D Magnetic Flux Rings radiating out */}
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
            <torusGeometry args={[0.08 + i * 0.03, 0.002, 8, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.5} transparent opacity={0.6 - i * 0.15} />
          </mesh>
        ))}
      </group>

      {/* ── 3D Center-Zero Galvanometer / Ammeter with Scale Numbers ── */}
      <group position={[tablePos[0] + 0.85, 1.18, tablePos[2]]}>
        {/* Galvanometer Body */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.22, 0.08]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Galvanometer White Face */}
        <mesh position={[0, 0, 0.041]}>
          <planeGeometry args={[0.26, 0.18]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>

        {/* Center-Zero Galvanometer Scale Numbers & Ticks (-100 ... 0 ... +100 mA) */}
        {[-100, -50, 0, 50, 100].map((val, i) => {
          const angle = Math.PI * 0.5 - (val / 100) * (Math.PI * 0.38);
          const r = 0.07;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r - 0.03, 0.043]}>
              <boxGeometry args={[0.002, 0.008, 0.001]} />
              <meshStandardMaterial color={val === 0 ? '#ef4444' : '#1e293b'} />
            </mesh>
          );
        })}

        {/* Galvanometer Needle */}
        <group position={[0, -0.03, 0.044]} ref={needleRef}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.003, 0.08, 0.002]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
        </group>
        {/* Needle Pivot Screw */}
        <mesh position={[0, -0.03, 0.046]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color="#333" metalness={0.8} />
        </mesh>
      </group>

      {/* Connecting Wires from Solenoid to Galvanometer */}
      <mesh position={[tablePos[0] + 0.42, 1.0, tablePos[2]]}>
        <boxGeometry args={[0.65, 0.006, 0.006]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
      </mesh>

      {/* ── 3D Bench Action Buttons for Magnet Thrust ── */}
      <group position={[tablePos[0] - 0.6, 1.02, tablePos[2] + 0.35]}>
        {/* Push IN Button */}
        <group
          position={[-0.2, 0, 0]}
          userData={{
            interactable: true,
            promptText: `⬅ Plunge Magnet IN (+mA Induced)`,
            onInteract: () => pushInductionMagnet(1),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.05, 0.12]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Pull OUT Button */}
        <group
          position={[0, 0, 0]}
          userData={{
            interactable: true,
            promptText: `➡ Pull Magnet OUT (-mA Induced)`,
            onInteract: () => pushInductionMagnet(-1),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.05, 0.12]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Speed Toggle Button */}
        <group
          position={[0.2, 0, 0]}
          userData={{
            interactable: true,
            promptText: `⚡ Change Speed [Current: ${induction.thrustSpeed === 0.5 ? 'Slow' : (induction.thrustSpeed === 2.0 ? 'Fast ⚡' : 'Medium')}]`,
            onInteract: cycleSpeed,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.18, 0.05, 0.12]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* Submit button */}
      {induction.readings && induction.readings.length >= 1 && !induction.submitted && (
        <group
          position={[tablePos[0] + 0.2, 1.08, tablePos[2] + 0.35]}
          userData={{
            interactable: true,
            promptText: "Submit Faraday's Law Induction Assessment ✓",
            onInteract: handleSubmit,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.45, 0.08, 0.18]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
