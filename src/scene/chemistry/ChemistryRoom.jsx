import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/api';
import ExperimentSelector from '../ExperimentSelector';
import FlameTestExperiment from './FlameTestExperiment';
import PHTestExperiment from './PHTestExperiment';
import PrecipitationExperiment from './PrecipitationExperiment';
import IodineClockExperiment from './IodineClockExperiment';
import SaltPrepExperiment from './SaltPrepExperiment';
import ElectrolysisExperiment from './ElectrolysisExperiment';
import DistillationExperiment from './DistillationExperiment';
import TableSpotlight from '../TableSpotlight';

// ── Burette Stand ──────────────────────────────────────────
function BuretteStand({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.04, 0.4]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.5, -0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.85, -0.15]} castShadow>
        <boxGeometry args={[0.25, 0.03, 0.03]} />
        <meshStandardMaterial color="#666" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── Burette ──
function Burette({ position, volumeUsed }) {
  const liquidLevel = 1 - Math.min(volumeUsed / 50, 1);
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 12]} />
        <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.3} roughness={0.05} metalness={0} transmission={0.8} />
      </mesh>
      <mesh position={[0, -0.35 + (liquidLevel * 0.35), 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.7 * liquidLevel, 12]} />
        <meshStandardMaterial color="#1e90ff" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.04, -0.3, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.02]} />
        <meshStandardMaterial color="#ff6633" />
      </mesh>
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.008, 0.005, 0.06, 8]} />
        <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ── Dripping Liquid Stream Animation ──
function DrippingStream({ position, color }) {
  const streamRef = useRef();
  useFrame(() => {
    if (streamRef.current) {
      streamRef.current.rotation.y += 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Falling liquid stream cylinder */}
      <mesh ref={streamRef} position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.24, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {/* Dripping drop at bottom */}
      <mesh position={[0, -0.24, 0]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} emissive={color} emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

// ── Conical Flask (1.6x Larger with Real-Time Fill Level Rise & Surface Swirl) ──
function ConicalFlask({ position, liquidColor, volumeAdded = 0, isTitrating = false, interactable, promptText, onInteract }) {
  // Real-time liquid volume rise ratio (25 mL initial -> 50 mL max)
  const fillRatio = Math.min(1.0, 0.35 + (volumeAdded / 50.0) * 0.55);
  const liquidHeight = 0.22 * fillRatio;
  const liquidY = -0.08 + liquidHeight * 0.5;
  const meniscusY = -0.08 + liquidHeight;

  return (
    <group position={position} userData={interactable ? { interactable: true, promptText, onInteract } : {}}>
      {/* Outer glass shell (1.6x larger) */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.18, 0.28, 20]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.02} transmission={0.9} />
      </mesh>
      {/* Flask Neck */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.12, 20]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.22} roughness={0.02} transmission={0.9} />
      </mesh>
      {/* Flask Glass Rim */}
      <mesh position={[0, 0.24, 0]}>
        <torusGeometry args={[0.042, 0.005, 8, 20]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} />
      </mesh>

      {/* ── Aqueous Solution Liquid inside Flask (Dynamic Height Rise!) ── */}
      <mesh position={[0, liquidY, 0]}>
        <cylinderGeometry args={[0.055 * fillRatio + 0.02, 0.16, liquidHeight, 20]} />
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.85}
          roughness={0.1}
          emissive={liquidColor}
          emissiveIntensity={liquidColor === '#ec4899' || liquidColor === '#c026d3' ? 0.7 : 0.3}
        />
      </mesh>

      {/* ── Liquid Meniscus Top Surface ── */}
      <mesh position={[0, meniscusY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.055 * fillRatio + 0.02, 20]} />
        <meshStandardMaterial
          color={liquidColor}
          transparent
          opacity={0.95}
          emissive={liquidColor}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* ── Drop Impact Pink Swirl Ring (appears when titrant drops fall into flask) ── */}
      {isTitrating && (
        <group position={[0, meniscusY + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.005, 0.03, 16]} />
          <meshStandardMaterial color="#f472b6" transparent opacity={0.9} emissive="#f472b6" emissiveIntensity={0.9} />
        </group>
      )}

      {/* ── Inner Light Glow inside Flask when Pink Endpoint reached ── */}
      {(liquidColor === '#ec4899' || liquidColor === '#c026d3') && (
        <pointLight position={[0, liquidY, 0]} color="#ec4899" intensity={3} distance={1.2} />
      )}
    </group>
  );
}

// ── Indicator Bottle ──
function IndicatorBottle({ position, interactable, promptText, onInteract }) {
  return (
    <group position={position} userData={interactable ? { interactable: true, promptText, onInteract } : {}}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
        <meshStandardMaterial color="#4a2a0a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.04, 12]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[0.05, 0.07]} />
        <meshStandardMaterial color="#f0e0c0" />
      </mesh>
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.08, 12]} />
        <meshStandardMaterial color="#ff1493" transparent opacity={0.7} emissive="#ff1493" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ── Titration Sub-Experiment ──
function TitrationExperiment({ tablePos }) {
  const chemistry = useGameStore((s) => s.chemistry);
  const heldItem = useGameStore((s) => s.heldItem);
  const setHeldItem = useGameStore((s) => s.setHeldItem);
  const placeFlask = useGameStore((s) => s.placeFlask);
  const addIndicator = useGameStore((s) => s.addIndicator);
  const addTitrant = useGameStore((s) => s.addTitrant);
  const markEndpoint = useGameStore((s) => s.markEndpoint);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);
  const resetChemistry = useGameStore((s) => s.resetChemistry);

  // Vibrant aqueous liquid colors & endpoint pink transition!
  const liquidColor = useMemo(() => {
    if (!chemistry.indicatorAdded) return '#38bdf8'; // Aqueous translucent cyan acid liquid
    const ratio = chemistry.volumeAdded / chemistry.equivalenceVolume;
    if (ratio < 0.85) return '#38bdf8'; // Cyan acid liquid
    if (ratio < 0.95) return '#f472b6'; // Blush pink transition
    if (ratio < 1.05) return '#ec4899'; // Hot pink endpoint!
    return '#c026d3'; // Deep magenta (overshot)
  }, [chemistry.volumeAdded, chemistry.equivalenceVolume, chemistry.indicatorAdded]);

  const handleMarkEndpoint = async () => {
    markEndpoint();
    const state = useGameStore.getState().chemistry;
    const finalState = {
      experimentType: 'titration',
      domain: 'titration',
      volumeAdded: state.volumeAdded,
      equivalenceVolume: state.equivalenceVolume,
      tolerance: 0.5,
      indicatorAdded: state.indicatorAdded,
      mixingOrderWrong: !state.indicatorAdded,
      timeTaken: state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0,
      overshoot: state.volumeAdded > state.equivalenceVolume * 1.05,
    };
    try {
      const report = await generateReport('chemistry', finalState, state.actions);
      const saved = await saveExperiment(studentId, 'chemistry', state.actions, finalState, report.score, report, classroom?.id);
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetChemistry();
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  const isTitrating = chemistry.flaskPlaced && chemistry.indicatorAdded && chemistry.volumeAdded > 0 && !chemistry.endpointMarked;

  return (
    <group>
      <BuretteStand position={[tablePos[0], 0.95, tablePos[2]]} />
      <group userData={
        chemistry.flaskPlaced && chemistry.indicatorAdded && !chemistry.endpointMarked
          ? { interactable: true, promptText: `Add titrant (0.5 mL) — ${chemistry.volumeAdded.toFixed(1)} mL total`, onInteract: () => addTitrant(0.5) }
          : {}
      }>
        <Burette position={[tablePos[0], 1.45, tablePos[2] - 0.15]} volumeUsed={chemistry.volumeAdded} />
      </group>

      {/* Dripping liquid stream when adding titrant */}
      {isTitrating && (
        <DrippingStream position={[tablePos[0], 1.35, tablePos[2] - 0.15]} color="#38bdf8" />
      )}

      {!chemistry.flaskPlaced && !heldItem && (
        <ConicalFlask
          position={[tablePos[0] + 1.2, 1.05, tablePos[2] + 0.3]}
          liquidColor={liquidColor}
          volumeAdded={0}
          interactable
          promptText="Pick up Conical Flask"
          onInteract={() => setHeldItem('flask')}
        />
      )}

      {heldItem === 'flask' && (
        <group position={[tablePos[0], 0.95, tablePos[2]]}
          userData={{ interactable: true, promptText: 'Place flask under burette', onInteract: placeFlask }}>
          <mesh>
            <boxGeometry args={[0.35, 0.02, 0.35]} />
            <meshStandardMaterial color="#06b6d4" transparent opacity={0.4} emissive="#06b6d4" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {chemistry.flaskPlaced && (
        <ConicalFlask
          position={[tablePos[0], 1.05, tablePos[2] - 0.15]}
          liquidColor={liquidColor}
          volumeAdded={chemistry.volumeAdded}
          isTitrating={isTitrating}
          interactable={false}
        />
      )}

      {!chemistry.indicatorAdded && chemistry.flaskPlaced && !heldItem && (
        <IndicatorBottle position={[tablePos[0] - 1.2, 1.05, tablePos[2] + 0.3]}
          interactable promptText="Add indicator to flask" onInteract={addIndicator} />
      )}
      {(!chemistry.flaskPlaced || chemistry.indicatorAdded) && (
        <IndicatorBottle position={[tablePos[0] - 1.2, 1.05, tablePos[2] + 0.3]} interactable={false} />
      )}

      {chemistry.flaskPlaced && chemistry.indicatorAdded && chemistry.volumeAdded > 0 && !chemistry.endpointMarked && (
        <group position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{ interactable: true, promptText: 'Mark Endpoint ✓', onInteract: handleMarkEndpoint }}>
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.08, 0.15]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* Decorative items */}
      <group position={[tablePos[0] - 1.5, 1.0, tablePos[2] - 0.5]}>
        {[0, 0.06, 0.12, 0.18, 0.24].map((x, i) => (
          <mesh key={i} position={[x - 0.12, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 8]} />
            <meshPhysicalMaterial color="#eef" transparent opacity={0.3} transmission={0.8} />
          </mesh>
        ))}
        <mesh>
          <boxGeometry args={[0.3, 0.02, 0.06]} />
          <meshStandardMaterial color="#5a4e3c" />
        </mesh>
      </group>

      <group position={[tablePos[0] + 1.8, 1.0, tablePos[2] + 0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
          <meshStandardMaterial color="#ddeeff" transparent opacity={0.4} />
        </mesh>
        <mesh position={[0.02, 0.1, 0]}>
          <cylinderGeometry args={[0.006, 0.004, 0.08, 6]} />
          <meshStandardMaterial color="#ccc" />
        </mesh>
      </group>
    </group>
  );
}

// ── Chemistry Room Composition ─────────────────────────────
export default function ChemistryRoom() {
  const activeExperiment = useGameStore((s) => s.activeExperiment);
  const tablePos = [-8, 0, -10];

  // Determine which experiment to show (default to titration)
  const expId = activeExperiment || 'titration';

  return (
    <group>
      {/* Experiment Selector on wall */}
      <ExperimentSelector
        room="chemistry"
        position={[-12.5, 1.8, -6]}
      />

      {/* Overhead Table Spotlight (dynamically illuminates table with experiment theme color) */}
      <TableSpotlight tablePos={tablePos} activeExp={expId} />

      {/* Conditionally render experiments */}
      {expId === 'titration' && <TitrationExperiment tablePos={tablePos} />}
      {expId === 'flame-test' && <FlameTestExperiment tablePos={tablePos} />}
      {expId === 'ph-test' && <PHTestExperiment tablePos={tablePos} />}
      {expId === 'precipitation' && <PrecipitationExperiment tablePos={tablePos} />}
      {expId === 'iodine-clock' && <IodineClockExperiment tablePos={tablePos} />}
      {expId === 'salt-prep' && <SaltPrepExperiment tablePos={tablePos} />}
      {expId === 'electrolysis' && <ElectrolysisExperiment tablePos={tablePos} />}
      {expId === 'distillation' && <DistillationExperiment tablePos={tablePos} />}

      {/* Room Lighting (shared) */}
      <pointLight position={[tablePos[0], 3, tablePos[2]]} intensity={2} distance={12} color="#e0f0ff" castShadow />
      <pointLight position={[tablePos[0] - 3, 3, tablePos[2] - 5]} intensity={1} distance={8} color="#d0e8ff" />
    </group>
  );
}
