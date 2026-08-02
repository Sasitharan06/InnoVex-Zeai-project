import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

// ── Animated Gas Bubble Stream ──
function BubbleStream({ position, isHydrogen, powerOn }) {
  const bubblesGroupRef = useRef();

  useFrame((_, delta) => {
    if (bubblesGroupRef.current && powerOn) {
      bubblesGroupRef.current.children.forEach((b) => {
        b.position.y += delta * b.userData.speed;
        if (b.position.y > 0.28) {
          b.position.y = 0.02;
        }
      });
    }
  });

  const count = isHydrogen ? 24 : 12; // 2:1 bubble count ratio!
  const bubbleColor = isHydrogen ? '#38bdf8' : '#7dd3fc';

  return (
    <group ref={bubblesGroupRef} position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const seedX = (Math.sin(i * 1.5) * 0.015);
        const seedZ = (Math.cos(i * 1.5) * 0.015);
        const startY = 0.02 + (i / count) * 0.26;
        const speed = 0.15 + (i % 3) * 0.05;
        const radius = isHydrogen ? 0.006 : 0.007;

        return (
          <mesh key={i} position={[seedX, startY, seedZ]} userData={{ speed }}>
            <sphereGeometry args={[radius, 8, 8]} />
            <meshStandardMaterial
              color={bubbleColor}
              transparent
              opacity={0.85}
              emissive={bubbleColor}
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function ElectrolysisExperiment({ tablePos }) {
  const electrolysis = useGameStore((s) => s.electrolysis);
  const toggleElectrolysisPower = useGameStore((s) => s.toggleElectrolysisPower);
  const setElectrolysisGas = useGameStore((s) => s.setElectrolysisGas);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetElectrolysis = useGameStore((s) => s.resetElectrolysis);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  useFrame((_, delta) => {
    if (electrolysis.powerOn && electrolysis.gasLevel < 1) {
      setElectrolysisGas(Math.min(electrolysis.gasLevel + delta * 0.1, 1));
    }
  });

  const handleSubmit = async () => {
    const finalState = {
      experimentType: 'electrolysis',
      powerOn: electrolysis.powerOn,
      hydrogenVolumeRatio: '2',
      oxygenVolumeRatio: '1',
      gasCollected: (electrolysis.gasLevel * 100).toFixed(0) + '%',
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', electrolysis.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetElectrolysis();
    } catch (err) {
      console.error('Electrolysis report failed:', err);
    }
  };

  const h2Vol = (electrolysis.gasLevel * 20).toFixed(1); // 0 -> 20 mL
  const o2Vol = (electrolysis.gasLevel * 10).toFixed(1); // 0 -> 10 mL

  return (
    <group>
      {/* Main Electrolysis Tank (1.8x Larger) */}
      <group position={[tablePos[0] - 0.2, 0.97, tablePos[2]]}>
        {/* Outer Glass Tank */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.28, 0.38, 20]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.2} roughness={0.02} transmission={0.9} />
        </mesh>

        {/* Acidified Water Solution */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.29, 0.27, 0.32, 20]} />
          <meshStandardMaterial color="#0284c7" transparent opacity={0.45} emissive="#0284c7" emissiveIntensity={0.2} />
        </mesh>
        {/* Water Top Surface Meniscus */}
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.29, 20]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} emissive="#38bdf8" emissiveIntensity={0.3} />
        </mesh>

        {/* Cathode (-) Electrode Carbon Rod */}
        <mesh position={[-0.12, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Anode (+) Electrode Carbon Rod */}
        <mesh position={[0.12, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ── Inverted Test Tube over Cathode (H₂ Gas — 2x Volume) ── */}
        <group position={[-0.12, 0.1, 0]}>
          {/* Glass Test Tube */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.28, 16]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} transmission={0.9} />
          </mesh>
          {/* Graduation Marks */}
          {[0.05, 0.1, 0.15, 0.2].map((y, i) => (
            <mesh key={i} position={[0.039, -0.1 + y, 0]}>
              <boxGeometry args={[0.008, 0.0015, 0.02]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* H₂ Gas Pocket Displacement at top (2x volume space) */}
          {electrolysis.gasLevel > 0 && (
            <mesh position={[0, 0.14 - electrolysis.gasLevel * 0.09, 0]}>
              <cylinderGeometry args={[0.036, 0.036, electrolysis.gasLevel * 0.16, 16]} />
              <meshStandardMaterial color="#e0f2fe" transparent opacity={0.7} emissive="#e0f2fe" emissiveIntensity={0.4} />
            </mesh>
          )}
          {/* Animated Hydrogen Bubbles Stream */}
          <BubbleStream position={[0, -0.14, 0]} isHydrogen={true} powerOn={electrolysis.powerOn} />
        </group>

        {/* ── Inverted Test Tube over Anode (O₂ Gas — 1x Volume) ── */}
        <group position={[0.12, 0.1, 0]}>
          {/* Glass Test Tube */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.038, 0.038, 0.28, 16]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.02} transmission={0.9} />
          </mesh>
          {/* Graduation Marks */}
          {[0.05, 0.1, 0.15, 0.2].map((y, i) => (
            <mesh key={i} position={[0.039, -0.1 + y, 0]}>
              <boxGeometry args={[0.008, 0.0015, 0.02]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ))}
          {/* O₂ Gas Pocket Displacement at top (1x volume space — exactly HALF of H2) */}
          {electrolysis.gasLevel > 0 && (
            <mesh position={[0, 0.14 - electrolysis.gasLevel * 0.045, 0]}>
              <cylinderGeometry args={[0.036, 0.036, electrolysis.gasLevel * 0.08, 16]} />
              <meshStandardMaterial color="#f0f9ff" transparent opacity={0.7} emissive="#f0f9ff" emissiveIntensity={0.4} />
            </mesh>
          )}
          {/* Animated Oxygen Bubbles Stream */}
          <BubbleStream position={[0, -0.14, 0]} isHydrogen={false} powerOn={electrolysis.powerOn} />
        </group>

        {/* ── Connecting Wires ── */}
        {/* Black Wire (-) to Cathode */}
        <mesh position={[-0.22, 0.18, 0]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        {/* Red Wire (+) to Anode */}
        <mesh position={[0.22, 0.18, 0]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.006, 0.006, 0.3, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
      </group>

      {/* ── 12V DC Power Supply Unit on Table ── */}
      <group
        position={[tablePos[0] + 1.1, 0.97, tablePos[2]]}
        userData={{
          interactable: true,
          promptText: `${electrolysis.powerOn ? 'Turn OFF' : 'Turn ON'} 12V DC Power Supply`,
          onInteract: toggleElectrolysisPower,
        }}
      >
        {/* Main Box */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.22, 0.28]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* 12V DC Screen Panel */}
        <mesh position={[0, 0.04, 0.141]}>
          <boxGeometry args={[0.28, 0.08, 0.01]} />
          <meshStandardMaterial
            color={electrolysis.powerOn ? '#0284c7' : '#0f172a'}
            emissive={electrolysis.powerOn ? '#0284c7' : '#000000'}
            emissiveIntensity={0.8}
          />
        </mesh>

        {/* Power Switch Toggle Button */}
        <group position={[0.1, -0.04, 0.145]}>
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial
              color={electrolysis.powerOn ? '#10b981' : '#ef4444'}
              emissive={electrolysis.powerOn ? '#10b981' : '#ef4444'}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>

        {/* Red Terminal (+) */}
        <mesh position={[-0.1, -0.04, 0.145]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {/* Black Terminal (-) */}
        <mesh position={[-0.04, -0.04, 0.145]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* ── Glowing 3D Submit / Verify 2:1 Gas Ratio Button on Table Foreground ── */}
      {electrolysis.powerOn && !electrolysis.submitted && (
        <group
          position={[tablePos[0], 1.12, tablePos[2] + 0.45]}
          userData={{
            interactable: true,
            promptText: `Submit 2:1 Gas Volume Ratio (${h2Vol} mL H₂ : ${o2Vol} mL O₂) ✓`,
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
