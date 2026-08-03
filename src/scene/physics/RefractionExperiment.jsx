import React from 'react';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

export default function RefractionExperiment({ tablePos }) {
  const refraction = useGameStore((s) => s.refraction);
  const toggleRefractionBeam = useGameStore((s) => s.toggleRefractionBeam);
  const adjustRefractionAngle = useGameStore((s) => s.adjustRefractionAngle);
  const takeRefractionReading = useGameStore((s) => s.takeRefractionReading);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetRefraction = useGameStore((s) => s.resetRefraction);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const n1 = 1.0; // Air
  const n2 = refraction.refractiveIndex; // Glass (1.5)
  const theta1Rad = (refraction.incidentAngle * Math.PI) / 180;
  const theta2Rad = Math.asin((n1 * Math.sin(theta1Rad)) / n2);
  const theta2Deg = (theta2Rad * 180) / Math.PI;

  const handleSubmit = async () => {
    const state = useGameStore.getState().refraction;
    const finalState = {
      experimentType: 'refraction',
      incidentAngle: state.incidentAngle + '°',
      refractedAngleComputed: theta2Deg.toFixed(1) + '°',
      refractiveIndex: state.refractiveIndex,
      readings: state.readings,
      snellsLawVerified: true,
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetRefraction();
    } catch (err) {
      console.error('Refraction report failed:', err);
    }
  };

  return (
    <group>
      {/* Real-World Optics Slate Bench Board */}
      <group position={[tablePos[0], 0.96, tablePos[2]]}>
        {/* Dark Slate Base Board */}
        <mesh position={[0, 0.003, 0]} receiveShadow>
          <boxGeometry args={[0.9, 0.01, 0.7]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* High-Contrast Grid & Protractor Circle Base */}
        <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* Protractor Tick Marks (every 15°) */}
        {Array.from({ length: 13 }).map((_, i) => {
          const deg = (i - 6) * 15;
          const rad = (deg * Math.PI) / 180;
          return (
            <mesh key={i} position={[Math.sin(rad) * 0.26, 0.01, Math.cos(rad) * 0.26]}>
              <boxGeometry args={[0.003, 0.001, 0.03]} />
              <meshStandardMaterial color="#38bdf8" />
            </mesh>
          );
        })}

        {/* ── Crisp Dashed Normal Line (Perpendicular to Interface) ── */}
        <mesh position={[0, 0.011, 0]}>
          <boxGeometry args={[0.004, 0.001, 0.6]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>

        {/* Rectangular Glass Block (Acrylic / Glass Material with n=1.5) */}
        <mesh position={[0, 0.05, 0.075]} castShadow>
          <boxGeometry args={[0.34, 0.08, 0.15]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.45}
            roughness={0.02}
            transmission={0.92}
            ior={1.5}
          />
        </mesh>
      </group>

      {/* ── Live 3D Snell's Law Calculation Card on Bench ── */}
      <group position={[tablePos[0] + 0.5, 1.1, tablePos[2] - 0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.16, 0.02]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} border="#38bdf8" />
        </mesh>
      </group>

      {/* ── 3D Bench Controls for Angle Adjustments (-5° / +5°) ── */}
      <group position={[tablePos[0] - 0.55, 1.02, tablePos[2] - 0.25]}>
        {/* Angle Decrement Button (-5°) */}
        <group
          position={[-0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Decrease Incident Angle (-5°) [Current: ${refraction.incidentAngle}°]`,
            onInteract: () => adjustRefractionAngle(-5),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
          </mesh>
        </group>
        {/* Angle Increment Button (+5°) */}
        <group
          position={[0.1, 0, 0]}
          userData={{
            interactable: true,
            promptText: `Increase Incident Angle (+5°) [Current: ${refraction.incidentAngle}°]`,
            onInteract: () => adjustRefractionAngle(5),
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.05, 0.12]} />
            <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
          </mesh>
        </group>
      </group>

      {/* Real-World Cylindrical Laser Pointer on Swivel Mount */}
      <group
        position={[
          tablePos[0] - 0.45 * Math.sin(theta1Rad),
          1.02,
          tablePos[2] - 0.45 * Math.cos(theta1Rad),
        ]}
        rotation={[0, -theta1Rad, 0]}
        userData={{
          interactable: true,
          promptText: `${refraction.beamActive ? 'Turn OFF' : 'Turn ON & Record'} Laser Pointer (θ₁=${refraction.incidentAngle}°)`,
          onInteract: () => {
            toggleRefractionBeam();
            takeRefractionReading();
          },
        }}
      >
        {/* Laser Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Laser Emitter Tip */}
        <mesh position={[0, 0, 0.09]}>
          <cylinderGeometry args={[0.01, 0.01, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* Laser Beams & Optics Ray Visuals (when active) */}
      {refraction.beamActive && (
        <group>
          {/* 1. Incident Laser Ray (High-Intensity Cyan Laser Line) */}
          <mesh
            position={[
              tablePos[0] - 0.225 * Math.sin(theta1Rad),
              1.02,
              tablePos[2] - 0.225 * Math.cos(theta1Rad),
            ]}
            rotation={[0, -theta1Rad, 0]}
          >
            <cylinderGeometry args={[0.005, 0.005, 0.45, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={5.0} />
          </mesh>

          {/* 2. Partial Reflected Ray (off Interface - Glowing Pink/Magenta) */}
          <mesh
            position={[
              tablePos[0] + 0.2 * Math.sin(theta1Rad),
              1.02,
              tablePos[2] - 0.2 * Math.cos(theta1Rad),
            ]}
            rotation={[0, theta1Rad, 0]}
          >
            <cylinderGeometry args={[0.0035, 0.0035, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={3.5} transparent opacity={0.8} />
          </mesh>

          {/* 3. Refracted Ray (inside Glass Block - Glowing Emerald Green Laser) */}
          <mesh
            position={[
              tablePos[0] - 0.075 * Math.sin(theta2Rad),
              1.02,
              tablePos[2] + 0.075 * Math.cos(theta2Rad),
            ]}
            rotation={[0, -theta2Rad, 0]}
          >
            <cylinderGeometry args={[0.005, 0.005, 0.15, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={5.0} />
          </mesh>

          {/* 4. Emergent Ray (Exiting Glass back into Air - Cyan Laser) */}
          <mesh
            position={[
              tablePos[0] - 0.15 * Math.sin(theta2Rad) - 0.12 * Math.sin(theta1Rad),
              1.02,
              tablePos[2] + 0.15 * Math.cos(theta2Rad) + 0.12 * Math.cos(theta1Rad),
            ]}
            rotation={[0, -theta1Rad, 0]}
          >
            <cylinderGeometry args={[0.004, 0.004, 0.24, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={4.0} />
          </mesh>

          {/* Intense Laser Point Lights at Boundary Intersections */}
          <pointLight position={[tablePos[0], 1.03, tablePos[2]]} color="#38bdf8" intensity={3.0} distance={1.2} />
          <pointLight
            position={[
              tablePos[0] - 0.15 * Math.sin(theta2Rad),
              1.03,
              tablePos[2] + 0.15 * Math.cos(theta2Rad),
            ]}
            color="#10b981"
            intensity={3.0}
            distance={1.2}
          />
        </group>
      )}

      {/* Submit button */}
      {refraction.beamActive && !refraction.submitted && (
        <group
          position={[tablePos[0] + 0.2, 1.08, tablePos[2] + 0.35]}
          userData={{
            interactable: true,
            promptText: "Verify Snell's Law (n = sin θ₁ / sin θ₂) ✓",
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
