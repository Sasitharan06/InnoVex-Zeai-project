import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

export default function ProjectileExperiment({ tablePos }) {
  const projectile = useGameStore((s) => s.projectile);
  const launchProjectile = useGameStore((s) => s.launchProjectile);
  const adjustProjectileAngle = useGameStore((s) => s.adjustProjectileAngle);
  const adjustProjectileVelocity = useGameStore((s) => s.adjustProjectileVelocity);
  const takeProjectileReading = useGameStore((s) => s.takeProjectileReading);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetProjectile = useGameStore((s) => s.resetProjectile);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const ballRef = useRef();

  const rad = (projectile.angle * Math.PI) / 180;
  const vx = projectile.velocity * Math.cos(rad);
  const vy = projectile.velocity * Math.sin(rad);
  const flightTime = (2 * vy) / 9.81;

  useFrame(() => {
    if (projectile.launched && ballRef.current && projectile.launchTime) {
      const t = (Date.now() - projectile.launchTime) / 1000;
      if (t <= flightTime) {
        const x = vx * t * 0.1; // scale down for lab table
        const y = (vy * t - 0.5 * 9.81 * t * t) * 0.1;
        ballRef.current.position.set(tablePos[0] - 1 + x, 1.05 + Math.max(0, y), tablePos[2]);
      }
    }
  });

  const handleSubmit = async () => {
    const state = useGameStore.getState().projectile;
    const finalState = {
      experimentType: 'projectile',
      launchAngle: state.angle + '°',
      initialVelocity: state.velocity + ' m/s',
      flightTime: flightTime.toFixed(2) + ' s',
      rangeDistance: state.maxDistance.toFixed(2) + ' m',
      readings: state.readings,
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetProjectile();
    } catch (err) {
      console.error('Projectile report failed:', err);
    }
  };

  // Trajectory parabolic line points
  const points = [];
  for (let t = 0; t <= flightTime; t += flightTime / 20) {
    const px = tablePos[0] - 1 + vx * t * 0.1;
    const py = 1.05 + Math.max(0, (vy * t - 0.5 * 9.81 * t * t) * 0.1);
    points.push(new THREE.Vector3(px, py, tablePos[2]));
  }
  const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      {/* Cannon / Launcher Base */}
      <group position={[tablePos[0] - 1, 1.0, tablePos[2]]}>
        {/* Swivel Base */}
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.04, 12]} />
          <meshStandardMaterial color="#333" metalness={0.7} />
        </mesh>
        {/* Cannon Barrel (rotates by angle) */}
        <mesh
          position={[0, 0.08, 0]}
          rotation={[0, 0, rad]}
          castShadow
        >
          <cylinderGeometry args={[0.03, 0.035, 0.25, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ── 3D Bench Controls for Angle Adjustments (-5° / +5°) ── */}
      <group position={[tablePos[0] - 1.4, 1.02, tablePos[2] - 0.2]}>
        {/* Angle Decrement Button (-5°) */}
        <group
          position={[-0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Decrease Angle (-5°) [Current: ${projectile.angle}°]`,
            onInteract: () => adjustProjectileAngle(-5),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* Angle Increment Button (+5°) */}
        <group
          position={[0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Increase Angle (+5°) [Current: ${projectile.angle}°]`,
            onInteract: () => adjustProjectileAngle(5),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* ── 3D Bench Controls for Speed/Velocity Adjustments (-2 m/s / +2 m/s) ── */}
      <group position={[tablePos[0] - 1.4, 1.02, tablePos[2] + 0.2]}>
        {/* Speed Decrement Button (-2 m/s) */}
        <group
          position={[-0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Decrease Speed (-2 m/s) [Current: ${projectile.velocity} m/s]`,
            onInteract: () => adjustProjectileVelocity(-2),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* Speed Increment Button (+2 m/s) */}
        <group
          position={[0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Increase Speed (+2 m/s) [Current: ${projectile.velocity} m/s]`,
            onInteract: () => adjustProjectileVelocity(2),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>

      {/* Target Pad on table */}
      <mesh position={[tablePos[0] - 1 + projectile.maxDistance * 0.1, 0.965, tablePos[2]]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.005, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
      </mesh>

      {/* Trajectory Parabola Line (when launched) */}
      {projectile.launched && (
        <primitive object={new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f59e0b', linewidth: 2 }))} />
      )}

      {/* Projectile Ball */}
      <mesh
        ref={ballRef}
        position={[tablePos[0] - 1, 1.05, tablePos[2]]}
        castShadow
      >
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Launch Trigger Button */}
      <group
        position={[tablePos[0] - 0.7, 1.05, tablePos[2] + 0.35]}
        userData={{
          interactable: true,
          promptText: `🚀 Launch Projectile Cannon (${projectile.angle}°, ${projectile.velocity} m/s)`,
          onInteract: () => {
            launchProjectile();
            takeProjectileReading();
          },
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.28, 0.07, 0.16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Submit button (after 1+ launches) */}
      {projectile.launched && !projectile.submitted && (
        <group
          position={[tablePos[0] + 0.2, 1.08, tablePos[2] + 0.35]}
          userData={{
            interactable: true,
            promptText: `Submit Trajectory Data & Calculate Parabola ✓`,
            onInteract: handleSubmit,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.42, 0.08, 0.18]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
