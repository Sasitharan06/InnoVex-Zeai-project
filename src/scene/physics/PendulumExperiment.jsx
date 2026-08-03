import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

const GRAVITY = 9.81;
const DAMPING = 0.002;

// ── Pendulum Stand ──
function PendulumStand({ position }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.04, 0.4]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Vertical pole */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 2.4, 8]} />
        <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Horizontal arm */}
      <mesh position={[0, 2.4, 0.1]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.25]} />
        <meshStandardMaterial color="#666" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Protractor base (on pole) */}
      <mesh position={[0, 2.3, 0.15]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32, 1, -Math.PI / 3, Math.PI * 2 / 3]} />
        <meshStandardMaterial color="#f5f5e0" side={THREE.DoubleSide} />
      </mesh>
      {/* Angle marks */}
      {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r = 0.165;
        return (
          <mesh key={deg} position={[Math.sin(rad) * r, 2.3 - Math.cos(rad) * r + 0.15, 0.16]}>
            <boxGeometry args={[0.003, 0.012, 0.001]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
      })}
    </group>
  );
}

// ── Animated Pendulum Bob + String ──
function PendulumBob({ mountPos, length, initialAngle, released, releaseTime }) {
  const bobRef = useRef();
  const stringRef = useRef();

  useFrame(() => {
    if (!bobRef.current || !stringRef.current) return;

    let angle;
    if (!released) {
      angle = (initialAngle * Math.PI) / 180;
    } else {
      const elapsed = (Date.now() - releaseTime) / 1000;
      const omega = Math.sqrt(GRAVITY / length);
      const theta0 = (initialAngle * Math.PI) / 180;
      angle = theta0 * Math.cos(omega * elapsed) * Math.exp(-DAMPING * elapsed);
    }

    // Bob position
    const bx = mountPos[0] + length * Math.sin(angle);
    const by = mountPos[1] - length * Math.cos(angle);
    bobRef.current.position.set(bx, by, mountPos[2]);

    // String — stretch from mount to bob
    const midX = (mountPos[0] + bx) / 2;
    const midY = (mountPos[1] + by) / 2;
    stringRef.current.position.set(midX, midY, mountPos[2]);
    const dx = bx - mountPos[0];
    const dy = by - mountPos[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    stringRef.current.scale.set(1, dist, 1);
    stringRef.current.rotation.z = Math.atan2(dx, -dy);
  });

  return (
    <>
      {/* String */}
      <mesh ref={stringRef}>
        <cylinderGeometry args={[0.003, 0.003, 1, 6]} />
        <meshStandardMaterial color="#8a7a5a" />
      </mesh>
      {/* Bob */}
      <mesh ref={bobRef} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
      </mesh>
    </>
  );
}

// ── Main Component ──
export default function PendulumExperiment({ tablePos }) {
  const pendulum = useGameStore((s) => s.pendulum);
  const releasePendulum = useGameStore((s) => s.releasePendulum);
  const togglePendulumTimer = useGameStore((s) => s.togglePendulumTimer);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetPendulum = useGameStore((s) => s.resetPendulum);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const mountPos = [tablePos[0], 2.4, tablePos[2] + 0.2];

  const handleSubmit = async () => {
    const state = useGameStore.getState().pendulum;
    const measuredPeriod = state.timerStart && state.timerStop
      ? ((state.timerStop - state.timerStart) / 1000) / 10 // divide by 10 oscillations
      : 0;
    const calculatedPeriod = 2 * Math.PI * Math.sqrt(state.length / GRAVITY);
    const percentError = calculatedPeriod > 0
      ? Math.abs(measuredPeriod - calculatedPeriod) / calculatedPeriod * 100
      : 100;

    const finalState = {
      experimentType: 'pendulum',
      length: state.length,
      initialAngle: state.initialAngle,
      measuredPeriod: measuredPeriod.toFixed(3),
      calculatedPeriod: calculatedPeriod.toFixed(3),
      percentError: percentError.toFixed(1),
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetPendulum();
    } catch (err) {
      console.error('Pendulum report failed:', err);
    }
  };

  return (
    <group>
      {/* Pendulum Stand */}
      <PendulumStand position={[tablePos[0], 0.02, tablePos[2]]} />

      {/* Animated Pendulum */}
      <PendulumBob
        mountPos={mountPos}
        length={pendulum.length}
        initialAngle={pendulum.initialAngle}
        released={pendulum.released}
        releaseTime={pendulum.releaseTime}
      />

      {/* Release button */}
      {!pendulum.released && !pendulum.submitted && (
        <group
          position={[tablePos[0] + 1.0, 1.2, tablePos[2]]}
          userData={{
            interactable: true,
            promptText: `Release Pendulum (L=${pendulum.length}m, θ=${pendulum.initialAngle}°)`,
            onInteract: releasePendulum,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.08, 0.12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* Timer start/stop button */}
      {pendulum.released && !pendulum.submitted && (
        <group
          position={[tablePos[0] + 1.0, 1.0, tablePos[2]]}
          userData={{
            interactable: true,
            promptText: pendulum.timerRunning ? 'Stop Timer (after 10 swings)' : 'Start Timer',
            onInteract: togglePendulumTimer,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.08, 0.12]} />
            <meshStandardMaterial
              color={pendulum.timerRunning ? '#ef4444' : '#06b6d4'}
              emissive={pendulum.timerRunning ? '#ef4444' : '#06b6d4'}
              emissiveIntensity={0.4}
            />
          </mesh>
        </group>
      )}

      {/* Submit button (after timing done) */}
      {pendulum.timerStop && !pendulum.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Submit Pendulum Result ✓',
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
