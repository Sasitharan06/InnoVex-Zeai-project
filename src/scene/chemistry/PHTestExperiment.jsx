import React from 'react';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

const SOLUTIONS = [
  { id: 'hcl', label: 'HCl', pH: 1, color: '#ff2222' },
  { id: 'vinegar', label: 'Vinegar', pH: 3, color: '#ff8844' },
  { id: 'water', label: 'Water', pH: 7, color: '#44cc44' },
  { id: 'naoh', label: 'NaOH', pH: 13, color: '#4444ff' },
];

function phToColor(pH) {
  if (pH <= 2) return '#ff1a1a';
  if (pH <= 4) return '#ff6633';
  if (pH <= 6) return '#ffcc00';
  if (pH <= 8) return '#44bb44';
  if (pH <= 10) return '#2288cc';
  if (pH <= 12) return '#4444cc';
  return '#6622aa';
}

// ── Test Tube ──
function TestTube({ position, solution, canDip, onDip }) {
  return (
    <group
      position={position}
      userData={canDip ? {
        interactable: true,
        promptText: `Dip strip in ${solution.label} (test tube)`,
        onInteract: () => onDip(solution.id, solution.pH, phToColor(solution.pH)),
      } : {}}
    >
      {/* Tube glass */}
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.18, 10]} />
        <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.3} roughness={0.05} transmission={0.7} />
      </mesh>
      {/* Liquid */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.017, 0.017, 0.12, 10]} />
        <meshStandardMaterial color={phToColor(solution.pH)} transparent opacity={0.6} />
      </mesh>
      {/* Round bottom */}
      <mesh position={[0, -0.09, 0]}>
        <sphereGeometry args={[0.02, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#ddeeff" transparent opacity={0.3} transmission={0.7} />
      </mesh>
    </group>
  );
}

// ── pH Color Chart (on wall) ──
function PHChart({ position }) {
  const colors = Array.from({ length: 14 }, (_, i) => phToColor(i + 1));
  return (
    <group position={position}>
      {/* Chart background */}
      <mesh>
        <planeGeometry args={[1.2, 0.4]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Color strips */}
      {colors.map((color, i) => (
        <mesh key={i} position={[-0.52 + i * 0.078, 0.02, 0.01]}>
          <planeGeometry args={[0.07, 0.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// ── Indicator Strip ──
function IndicatorStrip({ position, color, canPick, onPick }) {
  return (
    <group
      position={position}
      userData={canPick ? {
        interactable: true,
        promptText: 'Pick up pH indicator strip',
        onInteract: onPick,
      } : {}}
    >
      <mesh castShadow>
        <boxGeometry args={[0.06, 0.005, 0.2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

// ── Main Component ──
export default function PHTestExperiment({ tablePos }) {
  const phTest = useGameStore((s) => s.phTest);
  const heldItem = useGameStore((s) => s.heldItem);
  const pickStrip = useGameStore((s) => s.pickStrip);
  const dipStrip = useGameStore((s) => s.dipStrip);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetPHTest = useGameStore((s) => s.resetPHTest);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const handleSubmit = async () => {
    const state = useGameStore.getState().phTest;
    const correct = Math.abs(state.studentGuess - state.actualPH) <= 1;
    const finalState = {
      experimentType: 'ph-test',
      solutionId: state.selectedSolution,
      actualPH: state.actualPH,
      studentGuess: state.studentGuess,
      correct,
    };

    try {
      const report = await generateReport('chemistry', finalState);
      const saved = await saveExperiment(
        studentId, 'chemistry', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'chemistry', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetPHTest();
    } catch (err) {
      console.error('pH test report failed:', err);
    }
  };

  const canPickStrip = !heldItem && !phTest.stripDipped && !phTest.submitted;
  const canDip = heldItem === 'ph-strip' && !phTest.stripDipped;

  return (
    <group>
      {/* Test Tube Rack */}
      <group position={[tablePos[0], 0.96, tablePos[2]]}>
        {/* Rack base */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.02, 0.12]} />
          <meshStandardMaterial color="#5a4e3c" roughness={0.5} />
        </mesh>
        {/* Rack holder */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.06]} />
          <meshStandardMaterial color="#5a4e3c" roughness={0.5} />
        </mesh>
        {SOLUTIONS.map((sol, i) => (
          <TestTube
            key={sol.id}
            position={[-0.24 + i * 0.16, 0.1, 0]}
            solution={sol}
            canDip={canDip}
            onDip={dipStrip}
          />
        ))}
      </group>

      {/* Indicator Strip on table */}
      {!phTest.stripHeld && !phTest.stripDipped && (
        <IndicatorStrip
          position={[tablePos[0] + 1.2, 0.97, tablePos[2] + 0.4]}
          color={phTest.stripColor}
          canPick={canPickStrip}
          onPick={pickStrip}
        />
      )}

      {/* Dipped strip result (shows color) */}
      {phTest.stripDipped && (
        <IndicatorStrip
          position={[tablePos[0] + 1.2, 0.97, tablePos[2] + 0.4]}
          color={phTest.stripColor}
          canPick={false}
        />
      )}

      {/* pH Chart on wall */}
      <PHChart position={[tablePos[0] - 1, 2.2, -19.85]} />

      {/* 3D pH Value Guess Buttons on Table (Aim Crosshair + Press E) */}
      {phTest.stripDipped && (
        <group position={[tablePos[0] - 1.0, 0.97, tablePos[2] + 0.4]}>
          {[1, 3, 5, 7, 9, 11, 13].map((ph, i) => {
            const isSelected = phTest.studentGuess === ph;
            const btnColor = phToColor(ph);
            return (
              <group
                key={ph}
                position={[-0.45 + i * 0.15, 0.02, 0]}
                userData={{
                  interactable: true,
                  promptText: `Select pH ${ph} as guess`,
                  onInteract: () => useGameStore.getState().setPHGuess(ph),
                }}
              >
                <mesh castShadow>
                  <boxGeometry args={[0.13, 0.04, 0.12]} />
                  <meshStandardMaterial
                    color={isSelected ? btnColor : '#1e293b'}
                    emissive={btnColor}
                    emissiveIntensity={isSelected ? 0.8 : 0.2}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Submit button */}
      {phTest.stripDipped && phTest.studentGuess !== null && !phTest.submitted && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: `Submit pH ${phTest.studentGuess} Test ✓`,
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
