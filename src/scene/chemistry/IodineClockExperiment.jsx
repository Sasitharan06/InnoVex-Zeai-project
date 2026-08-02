import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

// ── Reagent Beaker ──
function ReagentBeaker({ position, label, color, canPour, onPour, isEmpty }) {
  return (
    <group
      position={position}
      userData={canPour ? {
        interactable: true,
        promptText: `Pour ${label}`,
        onInteract: onPour,
      } : {}}
    >
      {/* Glass */}
      <mesh castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.14, 16]} />
        <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} roughness={0.02} transmission={0.9} />
      </mesh>
      {/* Liquid inside */}
      {!isEmpty && (
        <group>
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.05, 0.045, 0.1, 16]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} emissive={color} emissiveIntensity={0.2} />
          </mesh>
          {/* Meniscus */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.05, 16]} />
            <meshStandardMaterial color={color} transparent opacity={0.85} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Main Component ──
export default function IodineClockExperiment({ tablePos }) {
  const iodineClock = useGameStore((s) => s.iodineClock);
  const addIodineReagent = useGameStore((s) => s.addIodineReagent);
  const triggerIodineColor = useGameStore((s) => s.triggerIodineColor);
  const stopIodineClock = useGameStore((s) => s.stopIodineClock);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetIodineClock = useGameStore((s) => s.resetIodineClock);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  // Color change trigger after reactionTime ms
  useFrame(() => {
    if (iodineClock.timerStarted && iodineClock.reactionTime && !iodineClock.colorChanged) {
      const elapsed = Date.now() - iodineClock.timerStarted;
      if (elapsed >= iodineClock.reactionTime) {
        triggerIodineColor();
      }
    }
  });

  const handleSubmit = async () => {
    const state = useGameStore.getState().iodineClock;
    const actualTime = state.reactionTime / 1000;
    const studentTime = state.studentStopTime
      ? (state.studentStopTime - state.timerStarted) / 1000
      : null;
    const delta = studentTime ? Math.abs(studentTime - actualTime) : 999;

    const finalState = {
      experimentType: 'iodine-clock',
      actualReactionTime: actualTime.toFixed(2),
      studentStopTime: studentTime?.toFixed(2) || 'not stopped',
      deltaSeconds: delta.toFixed(2),
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetIodineClock();
    } catch (err) {
      console.error('Iodine clock report failed:', err);
    }
  };

  // Color flip logic: clear aqueous cyan -> deep blue-black!
  const liquidColor = iodineClock.colorChanged ? '#030712' : '#38bdf8';
  const liquidEmissive = iodineClock.colorChanged ? '#1e1b4b' : '#38bdf8';
  const liquidOpacity = iodineClock.reagentsAdded >= 2 ? (iodineClock.colorChanged ? 1.0 : 0.65) : 0;
  const liquidLevel = iodineClock.reagentsAdded >= 2 ? 0.8 : (iodineClock.reagentsAdded === 1 ? 0.4 : 0);

  const canPourA = iodineClock.reagentsAdded === 0 && !iodineClock.submitted;
  const canPourB = iodineClock.reagentsAdded === 1 && !iodineClock.submitted;

  return (
    <group>
      {/* Reagent A (Aqueous Sky Blue) */}
      <ReagentBeaker
        position={[tablePos[0] - 0.5, 0.97, tablePos[2] + 0.4]}
        label="Reagent A (KIO₃)"
        color="#38bdf8"
        canPour={canPourA}
        onPour={addIodineReagent}
        isEmpty={iodineClock.reagentsAdded >= 1}
      />

      {/* Reagent B (Aqueous Cyan) */}
      <ReagentBeaker
        position={[tablePos[0] + 0.5, 0.97, tablePos[2] + 0.4]}
        label="Reagent B (NaHSO₃ + Starch)"
        color="#06b6d4"
        canPour={canPourB}
        onPour={addIodineReagent}
        isEmpty={iodineClock.reagentsAdded >= 2}
      />

      {/* Mixing Beaker */}
      <group position={[tablePos[0], 0.97, tablePos[2]]}>
        {/* Glass */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.09, 0.07, 0.18, 16]} />
          <meshPhysicalMaterial color="#e2e8f0" transparent opacity={0.2} roughness={0.02} transmission={0.9} />
        </mesh>

        {/* Liquid inside mixing beaker */}
        {liquidLevel > 0 && (
          <group>
            <mesh position={[0, -0.09 + liquidLevel * 0.08, 0]}>
              <cylinderGeometry args={[0.075, 0.065, 0.14 * liquidLevel, 16]} />
              <meshStandardMaterial
                color={liquidColor}
                transparent={!iodineClock.colorChanged}
                opacity={liquidOpacity}
                emissive={liquidEmissive}
                emissiveIntensity={iodineClock.colorChanged ? 0.8 : 0.2}
              />
            </mesh>
            {/* Meniscus top surface */}
            <mesh position={[0, -0.09 + liquidLevel * 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.075, 16]} />
              <meshStandardMaterial
                color={liquidColor}
                transparent={!iodineClock.colorChanged}
                opacity={liquidOpacity}
                emissive={liquidEmissive}
                emissiveIntensity={iodineClock.colorChanged ? 0.9 : 0.3}
              />
            </mesh>
          </group>
        )}

        {/* Glow Ring Light when Color Flips in 3D */}
        {iodineClock.colorChanged && (
          <pointLight position={[0, 0.05, 0]} color="#38bdf8" intensity={3} distance={1.5} />
        )}
      </group>

      {/* Stop Timer button (appears when timer running) */}
      {iodineClock.timerStarted && !iodineClock.studentStopTime && !iodineClock.submitted && (
        <group
          position={[tablePos[0] + 1.2, 1.2, tablePos[2]]}
          userData={{
            interactable: true,
            promptText: 'Stop Timer! (Color changed!)',
            onInteract: stopIodineClock,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.08, 0.15]} />
            <meshStandardMaterial
              color={iodineClock.colorChanged ? '#ef4444' : '#f59e0b'}
              emissive={iodineClock.colorChanged ? '#ef4444' : '#f59e0b'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      )}

      {/* Submit button (after stopping) */}
      {iodineClock.studentStopTime && !iodineClock.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Submit Iodine Clock Result ✓',
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
