import React, { useMemo } from 'react';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';
import ExperimentSelector from '../ExperimentSelector';
import OhmsLawExperiment from './OhmsLawExperiment';
import PendulumExperiment from './PendulumExperiment';
import ProjectileExperiment from './ProjectileExperiment';
import RefractionExperiment from './RefractionExperiment';
import InductionExperiment from './InductionExperiment';
import TableSpotlight from '../TableSpotlight';

// ── Breadboard ─────────────────────────────────────────────
function Breadboard({ position, slots, onSlotInteract, heldItem }) {
  const slotPositions = {
    slot1: [-0.6, 0.06, -0.15],
    slot2: [-0.3, 0.06, -0.15],
    slot3: [0, 0.06, -0.15],
    slot4: [0.3, 0.06, -0.15],
    slot5: [0.6, 0.06, -0.15],
  };

  const slotLabels = {
    slot1: 'Battery',
    slot2: 'Wire',
    slot3: 'Resistor',
    slot4: 'LED',
    slot5: 'Switch',
  };

  return (
    <group position={position}>
      {/* Board body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.08, 0.6]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.6} />
      </mesh>

      {/* Center groove */}
      <mesh position={[0, 0.045, 0]}>
        <boxGeometry args={[1.6, 0.01, 0.03]} />
        <meshStandardMaterial color="#d0c8b0" />
      </mesh>

      {/* Hole grid */}
      {Array.from({ length: 15 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => (
          <mesh key={`${i}-${j}`} position={[-0.7 + i * 0.1, 0.045, -0.2 + j * 0.12]}>
            <cylinderGeometry args={[0.008, 0.008, 0.02, 6]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))
      )}

      {/* Slot zones */}
      {Object.entries(slotPositions).map(([slotId, pos]) => {
        const component = slots[slotId];
        const isEmpty = !component;
        const canPlace = isEmpty && heldItem;

        return (
          <group key={slotId} position={pos}>
            {/* Slot highlight */}
            {isEmpty && (
              <mesh
                userData={
                  canPlace
                    ? {
                        interactable: true,
                        promptText: `Place ${heldItem} here (${slotLabels[slotId]})`,
                        onInteract: () => onSlotInteract(slotId),
                      }
                    : {}
                }
              >
                <boxGeometry args={[0.22, 0.02, 0.25]} />
                <meshStandardMaterial
                  color={canPlace ? '#10b981' : '#666'}
                  transparent
                  opacity={canPlace ? 0.4 : 0.15}
                  emissive={canPlace ? '#10b981' : '#000'}
                  emissiveIntensity={canPlace ? 0.5 : 0}
                />
              </mesh>
            )}

            {/* Placed component visualization */}
            {component === 'battery' && <BatteryModel />}
            {component === 'resistor' && <ResistorModel />}
            {component === 'led' && <LEDModel />}
            {component === 'switch' && <SwitchModel />}
            {component === 'wire' && <WireModel />}
          </group>
        );
      })}

      {/* Connection traces (visible when components placed) */}
      {Object.values(slots).filter(Boolean).length >= 2 && (
        <mesh position={[0, 0.045, -0.15]}>
          <boxGeometry args={[1.4, 0.005, 0.02]} />
          <meshStandardMaterial color="#c0a000" emissive="#c0a000" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  );
}

// ── Component Models ───────────────────────────────────────
function BatteryModel({ small = false }) {
  const s = small ? 0.7 : 1;
  return (
    <group scale={[s, s, s]}>
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.08, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.09, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      <mesh position={[-0.08, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.09, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}

function ResistorModel({ small = false }) {
  const s = small ? 0.7 : 1;
  return (
    <group scale={[s, s, s]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c4a35a" />
      </mesh>
      {[-0.03, -0.01, 0.01, 0.03].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.008, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color={['#ff0000', '#ff0000', '#8B4513', '#c0a000'][i]} />
        </mesh>
      ))}
      <mesh position={[-0.08, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.04, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
      <mesh position={[0.08, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.04, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
    </group>
  );
}

function LEDModel({ on = false, small = false }) {
  const ledOn = useGameStore((s) => s.physics.ledOn);
  const isOn = on || ledOn;
  const s = small ? 0.7 : 1;

  return (
    <group scale={[s, s, s]}>
      <mesh castShadow>
        <sphereGeometry args={[0.025, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isOn ? '#ff3333' : '#cc4444'}
          emissive={isOn ? '#ff0000' : '#000'}
          emissiveIntensity={isOn ? 2 : 0}
          transparent
          opacity={isOn ? 0.9 : 0.6}
        />
      </mesh>
      <mesh position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
        <meshStandardMaterial color="#aaa" metalness={0.6} />
      </mesh>
      <mesh position={[-0.01, -0.04, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.04, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
      <mesh position={[0.01, -0.04, 0]}>
        <cylinderGeometry args={[0.002, 0.002, 0.03, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
      {isOn && (
        <pointLight position={[0, 0.03, 0]} color="#ff3333" intensity={1.5} distance={2} />
      )}
    </group>
  );
}

function SwitchModel({ small = false }) {
  const switchOn = useGameStore((s) => s.physics.switchOn);
  const s = small ? 0.7 : 1;

  return (
    <group scale={[s, s, s]}>
      <mesh castShadow>
        <boxGeometry args={[0.1, 0.03, 0.06]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[switchOn ? 0.02 : -0.02, 0.025, 0]} rotation={[0, 0, switchOn ? 0.3 : -0.3]}>
        <boxGeometry args={[0.04, 0.03, 0.02]} />
        <meshStandardMaterial color={switchOn ? '#10b981' : '#666'} />
      </mesh>
    </group>
  );
}

function WireModel({ small = false }) {
  const s = small ? 0.7 : 1;
  return (
    <group scale={[s, s, s]}>
      <mesh>
        <cylinderGeometry args={[0.004, 0.004, 0.18, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e02020" />
      </mesh>
      <mesh position={[-0.095, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.01, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
      <mesh position={[0.095, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.01, 6]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} />
      </mesh>
    </group>
  );
}

// ── Component Tray ────────────────────────────────────────
function ComponentTray({ position, heldItem, setHeldItem }) {
  const components = [
    { id: 'battery', label: 'Battery', offset: [0, 0, -0.15], Model: BatteryModel },
    { id: 'wire', label: 'Wire', offset: [0.3, 0, -0.15], Model: WireModel },
    { id: 'resistor', label: 'Resistor', offset: [0.6, 0, -0.15], Model: ResistorModel },
    { id: 'led', label: 'LED', offset: [0, 0, 0.15], Model: LEDModel },
    { id: 'switch', label: 'Switch', offset: [0.3, 0, 0.15], Model: SwitchModel },
  ];

  const placedComponents = Object.values(useGameStore.getState().physics.slots).filter(Boolean);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.03, 0.5]} />
        <meshStandardMaterial color="#4a4035" roughness={0.5} />
      </mesh>

      {components.map(({ id, label, offset, Model }) => {
        const alreadyPlaced = placedComponents.includes(id);
        const isHeld = heldItem === id;
        if (alreadyPlaced || isHeld) return null;

        return (
          <group
            key={id}
            position={[offset[0] - 0.3, 0.05, offset[2]]}
            userData={{
              interactable: true,
              promptText: `Pick up ${label}`,
              onInteract: () => setHeldItem(id),
            }}
          >
            <Model small />
          </group>
        );
      })}
    </group>
  );
}

// ── Circuit Building Sub-Experiment ────────────────────────
function CircuitBuildingExperiment({ tablePos }) {
  const physics = useGameStore((s) => s.physics);
  const heldItem = useGameStore((s) => s.heldItem);
  const setHeldItem = useGameStore((s) => s.setHeldItem);
  const placeComponent = useGameStore((s) => s.placeComponent);
  const toggleSwitch = useGameStore((s) => s.toggleSwitch);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);
  const resetPhysics = useGameStore((s) => s.resetPhysics);

  const handleSlotInteract = (slotId) => {
    if (heldItem) {
      placeComponent(slotId, heldItem);
    }
  };

  const handleSubmitCircuit = async () => {
    const state = useGameStore.getState().physics;
    const placedComponents = Object.entries(state.slots)
      .filter(([, v]) => v)
      .map(([slot, component]) => ({ slot, component }));

    const finalState = {
      experimentType: 'circuit',
      componentsPlaced: placedComponents.map((c) => c.component),
      connections: placedComponents,
      circuitClosed: state.circuitComplete,
      current: state.current,
      voltage: state.voltage,
      resistance: state.resistance,
      switchOn: state.switchOn,
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
      resetPhysics();
    } catch (err) {
      console.error('Report generation failed:', err);
    }
  };

  return (
    <group>
      <Breadboard
        position={[tablePos[0], 1.0, tablePos[2]]}
        slots={physics.slots}
        onSlotInteract={handleSlotInteract}
        heldItem={heldItem}
      />

      <ComponentTray
        position={[tablePos[0] - 1.5, 1.0, tablePos[2] + 0.5]}
        heldItem={heldItem}
        setHeldItem={setHeldItem}
      />

      {physics.slots.slot5 === 'switch' && (
        <group
          position={[tablePos[0] + 1.2, 1.1, tablePos[2]]}
          userData={{
            interactable: true,
            promptText: `${physics.switchOn ? 'Open' : 'Close'} Switch`,
            onInteract: toggleSwitch,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.08, 0.1]} />
            <meshStandardMaterial
              color={physics.switchOn ? '#10b981' : '#ef4444'}
              emissive={physics.switchOn ? '#10b981' : '#ef4444'}
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      )}

      {physics.circuitComplete && (
        <group
          position={[tablePos[0] + 1.5, 1.2, tablePos[2] - 0.5]}
          userData={{
            interactable: true,
            promptText: 'Submit Circuit for Assessment ✓',
            onInteract: handleSubmitCircuit,
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[0.25, 0.08, 0.15]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {physics.ledOn && (
        <pointLight
          position={[tablePos[0] + 0.3, 1.3, tablePos[2] - 0.15]}
          color="#ff3333"
          intensity={3}
          distance={4}
        />
      )}

      {/* Decorative items */}
      <group position={[tablePos[0] + 1.8, 1.0, tablePos[2] + 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.04, 0.18]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshStandardMaterial color="#1a3a1a" emissive="#00ff00" emissiveIntensity={0.1} />
        </mesh>
      </group>

      {[0, 0.08, 0.16].map((x, i) => (
        <mesh key={i} position={[tablePos[0] - 1.8 + x, 1.0, tablePos[2] - 0.6]} rotation={[0, 0.3 * i, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.15, 6]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color={['#ff0000', '#0000ff', '#00aa00'][i]} />
        </mesh>
      ))}
    </group>
  );
}

// ── Physics Room Composition ───────────────────────────────
export default function PhysicsRoom() {
  const activeExperiment = useGameStore((s) => s.activeExperiment);
  const tablePos = [8, 0, -10];

  const expId = activeExperiment || 'circuit';

  return (
    <group>
      {/* Experiment Selector on wall */}
      <ExperimentSelector
        room="physics"
        position={[12.5, 1.8, -6]}
      />

      {/* Overhead Table Spotlight (dynamically illuminates table with experiment theme color) */}
      <TableSpotlight tablePos={tablePos} activeExp={expId} />

      {/* Conditionally render experiments */}
      {expId === 'circuit' && <CircuitBuildingExperiment tablePos={tablePos} />}
      {expId === 'ohms-law' && <OhmsLawExperiment tablePos={tablePos} />}
      {expId === 'pendulum' && <PendulumExperiment tablePos={tablePos} />}
      {expId === 'projectile' && <ProjectileExperiment tablePos={tablePos} />}
      {expId === 'refraction' && <RefractionExperiment tablePos={tablePos} />}
      {expId === 'induction' && <InductionExperiment tablePos={tablePos} />}

      {/* Room Lighting (shared) */}
      <pointLight position={[tablePos[0], 3, tablePos[2]]} intensity={2} distance={12} color="#fff5e0" castShadow />
      <pointLight position={[tablePos[0] + 3, 3, tablePos[2] - 5]} intensity={1} distance={8} color="#ffe8d0" />
    </group>
  );
}
