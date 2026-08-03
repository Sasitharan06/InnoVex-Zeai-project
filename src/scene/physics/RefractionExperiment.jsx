import React from 'react';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';

export default function RefractionExperiment({ tablePos }) {
  const refraction = useGameStore((s) => s.refraction);
  const toggleRefractionBeam = useGameStore((s) => s.toggleRefractionBeam);
  const adjustRefractionAngle = useGameStore((s) => s.adjustRefractionAngle);
  const setRefractionAngle = useGameStore((s) => s.setRefractionAngle);
  const takeRefractionReading = useGameStore((s) => s.takeRefractionReading);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetRefraction = useGameStore((s) => s.resetRefraction);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const n1 = 1.0; // Air
  const n2 = refraction.refractiveIndex; // Glass (1.5)
  const theta1Rad = (refraction.incidentAngle * Math.PI) / 180;
  const sinI = Math.sin(theta1Rad);
  const sinR = sinI / n2;
  const theta2Rad = Math.asin(sinR);
  const theta2Deg = (theta2Rad * 180) / Math.PI;

  const handleSubmit = async () => {
    const state = useGameStore.getState().refraction;
    const finalState = {
      experimentType: 'refraction',
      targetProcedure: "Snell's Law with Semicircular Glass Disc (15°, 20°, 25°, 30°, 35°)",
      incidentAngle: state.incidentAngle + '°',
      refractedAngleComputed: theta2Deg.toFixed(1) + '°',
      refractiveIndex: state.refractiveIndex,
      readings: state.readings,
      snellsLawVerified: true,
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId,
        'physics',
        state.actions,
        finalState,
        report.score,
        report,
        classroom?.id
      );
      addExperiment({
        ...saved,
        domain: 'physics',
        score: report.score,
        ai_report: report,
        created_at: saved.created_at || new Date().toISOString(),
      });
      setReport(report);
      resetRefraction();
    } catch (err) {
      console.error('Refraction report failed:', err);
    }
  };

  const angleOptions = [15, 20, 25, 30, 35];

  // Helper to render an optical pin stuck into the chart paper
  const renderOpticalPin = (x, z, color = '#ef4444', key) => (
    <group key={key} position={[x, 0.032, z]}>
      {/* Metallic Pin Shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.0015, 0.0008, 0.038, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Pin Spherical Head */}
      <mesh position={[0, 0.019, 0]}>
        <sphereGeometry args={[0.0055, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );

  return (
    <group>
      {/* Main Table Setup */}
      <group position={[tablePos[0], 0.96, tablePos[2]]}>
        {/* 1. Wooden Plank Base */}
        <mesh position={[0, 0.005, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.92, 0.016, 0.72]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>

        {/* 2. White Chart Paper Attached to Wooden Plank */}
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.86, 0.66]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>

        {/* ── Line MM (Interface Line between Air and Glass) ── */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.78, 0.001, 0.004]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* ── Line NN (Normal Line at Center Point O) ── */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[0.004, 0.001, 0.6]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.6} />
        </mesh>

        {/* ── Center Point O Marker ── */}
        <mesh position={[0, 0.016, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.001, 16]} />
          <meshStandardMaterial color="#2563eb" />
        </mesh>

        {/* ── Protractor Radial Markings (0° to 90° on both sides) ── */}
        {Array.from({ length: 25 }).map((_, i) => {
          const deg = (i - 12) * 7.5; // -90° to +90°
          const rad = (deg * Math.PI) / 180;
          const isMajor = [0, 15, 20, 25, 30, 35, 45, 60, 90].includes(Math.abs(deg));
          return (
            <group key={i}>
              <mesh position={[Math.sin(rad) * 0.24, 0.015, -Math.cos(rad) * 0.24]}>
                <boxGeometry args={[0.002, 0.001, isMajor ? 0.025 : 0.012]} rotation={[0, rad, 0]} />
                <meshStandardMaterial color={isMajor ? '#2563eb' : '#94a3b8'} />
              </mesh>
              <mesh position={[Math.sin(rad) * 0.24, 0.015, Math.cos(rad) * 0.24]}>
                <boxGeometry args={[0.002, 0.001, isMajor ? 0.025 : 0.012]} rotation={[0, rad, 0]} />
                <meshStandardMaterial color={isMajor ? '#059669' : '#94a3b8'} />
              </mesh>
            </group>
          );
        })}

        {/* ── 3. PERSISTENT DRAWN PENCIL LINES & OPTICAL PINS ON CHART PAPER ── */}
        {/* Render drawn lines for all recorded readings in the table */}
        {refraction.readings.map((reading, idx) => {
          const incRad = (reading.incidentAngle * Math.PI) / 180;
          const refRad = Math.asin(Math.sin(incRad) / 1.5);
          
          return (
            <group key={`drawn-reading-${idx}`}>
              {/* Incident Pencil Line drawn on paper */}
              <mesh
                position={[-0.19 * Math.sin(incRad), 0.0151, -0.19 * Math.cos(incRad)]}
                rotation={[0, -incRad, 0]}
              >
                <boxGeometry args={[0.0025, 0.0005, 0.38]} />
                <meshStandardMaterial color="#2563eb" />
              </mesh>

              {/* Emergent Refracted Pencil Line drawn on paper */}
              <mesh
                position={[0.22 * Math.sin(refRad), 0.0151, 0.22 * Math.cos(refRad)]}
                rotation={[0, refRad, 0]}
              >
                <boxGeometry args={[0.0025, 0.0005, 0.44]} />
                <meshStandardMaterial color="#059669" />
              </mesh>

              {/* Optical Pin 1 & Pin 2 along Incident Line */}
              {renderOpticalPin(-0.14 * Math.sin(incRad), -0.14 * Math.cos(incRad), '#38bdf8', `pin-inc1-${idx}`)}
              {renderOpticalPin(-0.28 * Math.sin(incRad), -0.28 * Math.cos(incRad), '#38bdf8', `pin-inc2-${idx}`)}

              {/* Optical Pin 3 & Pin 4 along Emergent Refracted Line */}
              {renderOpticalPin(0.20 * Math.sin(refRad), 0.20 * Math.cos(refRad), '#10b981', `pin-ref1-${idx}`)}
              {renderOpticalPin(0.32 * Math.sin(refRad), 0.32 * Math.cos(refRad), '#10b981', `pin-ref2-${idx}`)}
            </group>
          );
        })}

        {/* Draw active line preview if current angle hasn't been recorded yet */}
        {!refraction.readings.some((r) => r.incidentAngle === refraction.incidentAngle) && (
          <group key="drawn-current">
            <mesh
              position={[-0.19 * Math.sin(theta1Rad), 0.0151, -0.19 * Math.cos(theta1Rad)]}
              rotation={[0, -theta1Rad, 0]}
            >
              <boxGeometry args={[0.002, 0.0005, 0.38]} />
              <meshStandardMaterial color="#60a5fa" transparent opacity={0.6} />
            </mesh>
            <mesh
              position={[0.22 * Math.sin(theta2Rad), 0.0151, 0.22 * Math.cos(theta2Rad)]}
              rotation={[0, theta2Rad, 0]}
            >
              <boxGeometry args={[0.002, 0.0005, 0.44]} />
              <meshStandardMaterial color="#34d399" transparent opacity={0.6} />
            </mesh>
            {renderOpticalPin(-0.24 * Math.sin(theta1Rad), -0.24 * Math.cos(theta1Rad), '#f59e0b', 'pin-cur1')}
            {renderOpticalPin(0.26 * Math.sin(theta2Rad), 0.26 * Math.cos(theta2Rad), '#f59e0b', 'pin-cur2')}
          </group>
        )}

        {/* ── 4. Semicircular Glass Disc ── */}
        {/* Diameter lies on Interface line MM, Center coincides with Point O */}
        <mesh position={[0, 0.038, 0.09]} rotation={[0, -Math.PI / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.046, 48, 1, false, 0, Math.PI]} />
          <meshPhysicalMaterial
            color="#e0f2fe"
            transparent
            opacity={0.52}
            roughness={0.03}
            transmission={0.92}
            ior={1.5}
          />
        </mesh>
        {/* Glass Disc Outer Bevel Rim */}
        <mesh position={[0, 0.038, 0.09]} rotation={[0, -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.181, 0.181, 0.004, 48, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* ── 5. Quick-Select Angle Buttons on Bench (15°, 20°, 25°, 30°, 35°) ── */}
      <group position={[tablePos[0] - 0.45, 1.01, tablePos[2] - 0.28]}>
        {angleOptions.map((ang, idx) => {
          const isSelected = refraction.incidentAngle === ang;
          const isRecorded = refraction.readings.some((r) => r.incidentAngle === ang);
          return (
            <group
              key={ang}
              position={[(idx - 2) * 0.09, 0, 0]}
              userData={{
                interactable: true,
                promptText: `Set Angle i = ${ang}° ${isRecorded ? '(Recorded ✓)' : ''}`,
                onInteract: () => setRefractionAngle(ang),
              }}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.08, 0.035, 0.08]} />
                <meshStandardMaterial
                  color={isRecorded ? '#10b981' : isSelected ? '#38bdf8' : '#1e293b'}
                  emissive={isRecorded ? '#10b981' : isSelected ? '#38bdf8' : '#000000'}
                  emissiveIntensity={isSelected || isRecorded ? 0.5 : 0}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ── 6. Laser Light Emitter (Swivels based on Incident Angle i) ── */}
      <group
        position={[
          tablePos[0] - 0.42 * Math.sin(theta1Rad),
          1.02,
          tablePos[2] - 0.42 * Math.cos(theta1Rad),
        ]}
        rotation={[0, -theta1Rad, 0]}
        userData={{
          interactable: true,
          promptText: `Send Laser Light (i = ${refraction.incidentAngle}°) & Trace Line`,
          onInteract: () => {
            takeRefractionReading();
          },
        }}
      >
        {/* Laser Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Laser Metallic Barrel Ring */}
        <mesh position={[0, 0, 0.04]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#dc2626" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Emitter Tip */}
        <mesh position={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.0} />
        </mesh>
      </group>

      {/* ── 7. Active Optical Laser Beams (Air -> Glass Disc -> Air) ── */}
      {refraction.beamActive && (
        <group>
          {/* A. Incident Laser Ray (Air -> Point O at angle i) */}
          <mesh
            position={[
              tablePos[0] - 0.21 * Math.sin(theta1Rad),
              1.025,
              tablePos[2] - 0.21 * Math.cos(theta1Rad),
            ]}
            rotation={[0, -theta1Rad, 0]}
          >
            <cylinderGeometry args={[0.0045, 0.0045, 0.42, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={6.0} />
          </mesh>

          {/* B. Refracted Laser Ray (Inside Glass Disc from O to Curved Boundary) */}
          <mesh
            position={[
              tablePos[0] + 0.09 * Math.sin(theta2Rad),
              1.025,
              tablePos[2] + 0.09 * Math.cos(theta2Rad),
            ]}
            rotation={[0, theta2Rad, 0]}
          >
            <cylinderGeometry args={[0.0045, 0.0045, 0.18, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={6.0} />
          </mesh>

          {/* C. Emergent Laser Ray (Emerging from curved boundary into Air) */}
          <mesh
            position={[
              tablePos[0] + (0.18 + 0.15) * Math.sin(theta2Rad),
              1.025,
              tablePos[2] + (0.18 + 0.15) * Math.cos(theta2Rad),
            ]}
            rotation={[0, theta2Rad, 0]}
          >
            <cylinderGeometry args={[0.004, 0.004, 0.3, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={4.5} />
          </mesh>

          {/* Intense Point Light Glow at Center O Intersection */}
          <pointLight position={[tablePos[0], 1.03, tablePos[2]]} color="#ef4444" intensity={4.0} distance={0.8} />
          {/* Glow Point at Glass Boundary Exit */}
          <pointLight
            position={[
              tablePos[0] + 0.18 * Math.sin(theta2Rad),
              1.03,
              tablePos[2] + 0.18 * Math.cos(theta2Rad),
            ]}
            color="#10b981"
            intensity={3.0}
            distance={0.8}
          />
        </group>
      )}

      {/* ── 8. Submit Action Button on Bench ── */}
      {refraction.readings.length > 0 && !refraction.submitted && (
        <group
          position={[tablePos[0] + 0.28, 1.06, tablePos[2] + 0.26]}
          userData={{
            interactable: true,
            promptText: `Submit All (${refraction.readings.length}/5) Traced Angles & Verify Snell's Law ✓`,
            onInteract: handleSubmit,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.07, 0.16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
