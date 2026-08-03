import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
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
  const setPendulumLength = useGameStore((s) => s.setPendulumLength);
  const setPendulumAngle = useGameStore((s) => s.setPendulumAngle);
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
      const report = await generateReport('physics', finalState, state.actions);
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

      {/* ── Table-Side 3D Control Console ── */}
      <group position={[tablePos[0] + 0.7, 1.01, tablePos[2]]}>
        {/* Main Console Box Base */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.06, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* 3D Digital Screen Display */}
        <mesh position={[0, 0.065, -0.12]} rotation={[-Math.PI / 6, 0, 0]}>
          <boxGeometry args={[0.55, 0.12, 0.02]} />
          <meshStandardMaterial color="#0f172a" emissive="#0284c7" emissiveIntensity={0.3} />
        </mesh>
        <Text
          position={[0, 0.075, -0.1]}
          rotation={[-Math.PI / 6, 0, 0]}
          fontSize={0.045}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          {`L: ${pendulum.length.toFixed(1)}m  |  Angle: ${pendulum.initialAngle}°`}
        </Text>

        {/* ── 3D Table Buttons for Length (L) ── */}
        {!pendulum.released && (
          <>
            {/* Decrease Length (-0.1m) */}
            <group
              position={[-0.2, 0.07, 0.02]}
              userData={{
                interactable: true,
                promptText: `Decrease Length -0.1m (Current: ${pendulum.length.toFixed(1)}m)`,
                onInteract: () => setPendulumLength(Math.max(0.5, Number((pendulum.length - 0.1).toFixed(1)))),
              }}
            >
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.04, 0.1]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                L -
              </Text>
            </group>

            {/* Increase Length (+0.1m) */}
            <group
              position={[-0.07, 0.07, 0.02]}
              userData={{
                interactable: true,
                promptText: `Increase Length +0.1m (Current: ${pendulum.length.toFixed(1)}m)`,
                onInteract: () => setPendulumLength(Math.min(2.0, Number((pendulum.length + 0.1).toFixed(1)))),
              }}
            >
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.04, 0.1]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                L +
              </Text>
            </group>

            {/* ── 3D Table Buttons for Angle (θ) ── */}
            {/* Decrease Angle (-5°) */}
            <group
              position={[0.07, 0.07, 0.02]}
              userData={{
                interactable: true,
                promptText: `Decrease Angle -5° (Current: ${pendulum.initialAngle}°)`,
                onInteract: () => setPendulumAngle(Math.max(10, pendulum.initialAngle - 5)),
              }}
            >
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.04, 0.1]} />
                <meshStandardMaterial color="#db2777" emissive="#db2777" emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                θ -
              </Text>
            </group>

            {/* Increase Angle (+5°) */}
            <group
              position={[0.2, 0.07, 0.02]}
              userData={{
                interactable: true,
                promptText: `Increase Angle +5° (Current: ${pendulum.initialAngle}°)`,
                onInteract: () => setPendulumAngle(Math.min(60, pendulum.initialAngle + 5)),
              }}
            >
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.04, 0.1]} />
                <meshStandardMaterial color="#db2777" emissive="#db2777" emissiveIntensity={0.4} />
              </mesh>
              <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.035} color="#ffffff" anchorX="center" anchorY="middle">
                θ +
              </Text>
            </group>
          </>
        )}

        {/* ── Release Button ── */}
        {!pendulum.released && !pendulum.submitted && (
          <group
            position={[0, 0.07, 0.14]}
            userData={{
              interactable: true,
              promptText: `Release Pendulum (L=${pendulum.length}m, θ=${pendulum.initialAngle}°)`,
              onInteract: releasePendulum,
            }}
          >
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.04, 0.09]} />
              <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
            </mesh>
            <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.038} color="#ffffff" anchorX="center" anchorY="middle">
              🎯 Release Pendulum
            </Text>
          </group>
        )}

        {/* ── Timer Start/Stop Button ── */}
        {pendulum.released && !pendulum.submitted && (
          <group
            position={[-0.1, 0.07, 0.1]}
            userData={{
              interactable: true,
              promptText: pendulum.timerRunning ? 'Stop Timer (after 10 swings)' : 'Start Timer',
              onInteract: togglePendulumTimer,
            }}
          >
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.04, 0.12]} />
              <meshStandardMaterial
                color={pendulum.timerRunning ? '#ef4444' : '#06b6d4'}
                emissive={pendulum.timerRunning ? '#ef4444' : '#06b6d4'}
                emissiveIntensity={0.5}
              />
            </mesh>
            <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.032} color="#ffffff" anchorX="center" anchorY="middle">
              {pendulum.timerRunning ? '⏹ Stop Timer' : '⏱ Start Timer'}
            </Text>
          </group>
        )}

        {/* ── Submit Button ── */}
        {pendulum.timerStop && !pendulum.submitted && (
          <group
            position={[0.15, 0.07, 0.1]}
            userData={{
              interactable: true,
              promptText: 'Submit Pendulum Result ✓',
              onInteract: handleSubmit,
            }}
          >
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.04, 0.12]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
            </mesh>
            <Text position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.032} color="#ffffff" anchorX="center" anchorY="middle">
              📊 Submit ✓
            </Text>
          </group>
        )}
      </group>
    </group>
  );
}
