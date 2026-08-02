import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGameStore from '../../store/gameStore';
import { generateReport } from '../../services/aiReport';
import { saveExperiment } from '../../services/supabase';

// ── Meter (Ammeter / Voltmeter) ──
function Meter({ position, label, value, maxValue, unit, color }) {
  const needleRef = useRef();
  const targetAngle = -(value / maxValue) * Math.PI * 0.8 + Math.PI * 0.4;

  useFrame(() => {
    if (needleRef.current) {
      needleRef.current.rotation.z = THREE.MathUtils.lerp(
        needleRef.current.rotation.z,
        targetAngle,
        0.08
      );
    }
  });

  return (
    <group position={position}>
      {/* Meter body */}
      <mesh castShadow>
        <boxGeometry args={[0.25, 0.18, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0, 0.032]}>
        <circleGeometry args={[0.07, 32, Math.PI * 0.1, Math.PI * 0.8]} />
        <meshStandardMaterial color="#f5f5e8" />
      </mesh>
      {/* Scale arc marks */}
      {Array.from({ length: 11 }).map((_, i) => {
        const angle = Math.PI * 0.1 + (i / 10) * Math.PI * 0.8;
        const r = 0.065;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r - 0.02, 0.034]}>
            <boxGeometry args={[0.002, 0.008, 0.001]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
      })}
      {/* Needle */}
      <group position={[0, -0.02, 0.035]} ref={needleRef}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.003, 0.06, 0.002]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      {/* Pivot dot */}
      <mesh position={[0, -0.02, 0.036]}>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Terminal screws */}
      {[-0.08, 0.08].map((x, i) => (
        <mesh key={i} position={[x, -0.08, 0.032]}>
          <cylinderGeometry args={[0.008, 0.008, 0.015, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color={i === 0 ? '#cc0000' : '#333'} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Component Tray for Step-by-Step Circuit Building ──
function OhmsComponentTray({ position, placedComponents, onPlace }) {
  const components = [
    { id: 'battery', name: 'DC Battery Source (12V)', color: '#ef4444', pos: [-0.35, 0.04, -0.15] },
    { id: 'resistor', name: 'Resistor R (100 Ω)', color: '#eab308', pos: [-0.18, 0.04, -0.15] },
    { id: 'voltmeter', name: 'Voltmeter (Parallel)', color: '#0284c7', pos: [0, 0.04, -0.15] },
    { id: 'ammeter', name: 'Ammeter (Series)', color: '#dc2626', pos: [0.18, 0.04, -0.15] },
    { id: 'switch', name: 'Switch Key', color: '#10b981', pos: [0.35, 0.04, -0.15] },
  ];

  return (
    <group position={position}>
      {/* Tray Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.03, 0.18]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      {components.map((comp) => {
        const isPlaced = placedComponents.includes(comp.id);
        return (
          <group
            key={comp.id}
            position={comp.pos}
            userData={
              !isPlaced
                ? {
                    interactable: true,
                    promptText: `Pick up & place ${comp.name} into circuit`,
                    onInteract: () => onPlace(comp.id),
                  }
                : {}
            }
          >
            <mesh castShadow>
              <boxGeometry args={[0.12, 0.05, 0.1]} />
              <meshStandardMaterial
                color={isPlaced ? '#334155' : comp.color}
                opacity={isPlaced ? 0.3 : 1.0}
                transparent={isPlaced}
                emissive={isPlaced ? '#000' : comp.color}
                emissiveIntensity={isPlaced ? 0 : 0.3}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ── Interactive Circuit Board ──
function InteractiveCircuitBoard({ position, placedComponents, switchClosed, voltage, resistance }) {
  const current = switchClosed ? voltage / resistance : 0;
  const ledOn = current > 0.005;

  const hasBattery = placedComponents.includes('battery');
  const hasResistor = placedComponents.includes('resistor');
  const hasVoltmeter = placedComponents.includes('voltmeter');
  const hasAmmeter = placedComponents.includes('ammeter');
  const hasSwitch = placedComponents.includes('switch');

  return (
    <group position={position}>
      {/* Board Base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.04, 0.65]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} />
      </mesh>

      {/* ── Component Slots on Board ── */}
      {/* Battery Slot */}
      <group position={[-0.38, 0.04, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, hasBattery ? 0.08 : 0.02, 0.08]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={hasBattery ? 1.0 : 0.3} />
        </mesh>
      </group>

      {/* Resistor Slot */}
      <group position={[0, 0.04, 0.18]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.12, 10]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#eab308" transparent opacity={hasResistor ? 1.0 : 0.3} />
        </mesh>
      </group>

      {/* Voltmeter Connection Slot (Parallel across Resistor) */}
      <group position={[0, 0.04, -0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, hasVoltmeter ? 0.08 : 0.02, 0.08]} />
          <meshStandardMaterial color="#0284c7" transparent opacity={hasVoltmeter ? 1.0 : 0.3} />
        </mesh>
      </group>

      {/* Ammeter Slot (Series) */}
      <group position={[0.38, 0.04, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.14, hasAmmeter ? 0.08 : 0.02, 0.08]} />
          <meshStandardMaterial color="#dc2626" transparent opacity={hasAmmeter ? 1.0 : 0.3} />
        </mesh>
      </group>

      {/* Switch Key Slot */}
      <group position={[-0.15, 0.04, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.05, 0.08]} />
          <meshStandardMaterial
            color={hasSwitch ? (switchClosed ? '#10b981' : '#f59e0b') : '#f59e0b'}
            transparent
            opacity={hasSwitch ? 1.0 : 0.3}
            emissive={switchClosed ? '#10b981' : '#000000'}
            emissiveIntensity={switchClosed ? 0.6 : 0}
          />
        </mesh>
      </group>

      {/* LED Indicator Light */}
      <mesh position={[0.25, 0.06, 0.18]} castShadow>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial
          color={ledOn ? '#10b981' : '#475569'}
          emissive={ledOn ? '#10b981' : '#000000'}
          emissiveIntensity={ledOn ? 2.0 : 0}
        />
      </mesh>

      {/* Circuit Wires */}
      {placedComponents.length > 0 && (
        <group>
          <mesh position={[-0.2, 0.03, -0.18]}>
            <boxGeometry args={[0.4, 0.005, 0.005]} />
            <meshStandardMaterial color={switchClosed ? '#38bdf8' : '#ef4444'} />
          </mesh>
          <mesh position={[0.2, 0.03, 0.18]}>
            <boxGeometry args={[0.4, 0.005, 0.005]} />
            <meshStandardMaterial color={switchClosed ? '#38bdf8' : '#ef4444'} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Main Component ──
export default function OhmsLawExperiment({ tablePos }) {
  const ohmsLaw = useGameStore((s) => s.ohmsLaw);
  const setOhmsVoltage = useGameStore((s) => s.setOhmsVoltage);
  const toggleOhmsDiagram = useGameStore((s) => s.toggleOhmsDiagram);
  const placeOhmsComponent = useGameStore((s) => s.placeOhmsComponent);
  const toggleOhmsSwitch = useGameStore((s) => s.toggleOhmsSwitch);
  const takeOhmsReading = useGameStore((s) => s.takeOhmsReading);
  const setReport = useGameStore((s) => s.setReport);
  const addExperiment = useGameStore((s) => s.addExperiment);
  const resetOhmsLaw = useGameStore((s) => s.resetOhmsLaw);
  const studentId = useGameStore((s) => s.studentId);
  const classroom = useGameStore((s) => s.classroom);

  const current = ohmsLaw.switchClosed ? ohmsLaw.voltage / ohmsLaw.resistance : 0;

  const cycleVoltage = () => {
    const nextV = ohmsLaw.voltage >= 12 ? 2 : ohmsLaw.voltage + 2;
    setOhmsVoltage(nextV);
  };

  const handleSubmit = async () => {
    const state = useGameStore.getState().ohmsLaw;
    const readings = state.readings;
    let resistanceComputed = state.resistance;
    if (readings.length >= 2) {
      const sumVI = readings.reduce((s, r) => s + r.voltage * r.current, 0);
      const sumI2 = readings.reduce((s, r) => s + r.current * r.current, 0);
      if (sumI2 > 0) resistanceComputed = sumVI / sumI2;
    }
    const accuracy = Math.max(0, 100 - Math.abs(resistanceComputed - state.resistance) / state.resistance * 100);

    const finalState = {
      experimentType: 'ohms-law',
      readings,
      resistanceComputed: resistanceComputed.toFixed(1),
      expectedResistance: state.resistance,
      accuracy: accuracy.toFixed(1),
    };

    try {
      const report = await generateReport('physics', finalState);
      const saved = await saveExperiment(
        studentId, 'physics', state.actions, finalState, report.score, report, classroom?.id
      );
      addExperiment({ ...saved, domain: 'physics', score: report.score, ai_report: report, created_at: saved.created_at || new Date().toISOString() });
      setReport(report);
      resetOhmsLaw();
    } catch (err) {
      console.error('Ohms law report failed:', err);
    }
  };

  return (
    <group>
      {/* Interactive Circuit Assembly Board */}
      <InteractiveCircuitBoard
        position={[tablePos[0], 0.96, tablePos[2]]}
        placedComponents={ohmsLaw.placedComponents}
        switchClosed={ohmsLaw.switchClosed}
        voltage={ohmsLaw.voltage}
        resistance={ohmsLaw.resistance}
      />

      {/* Component Placement Tray on Table */}
      {!ohmsLaw.circuitBuilt && (
        <OhmsComponentTray
          position={[tablePos[0], 0.96, tablePos[2] + 0.45]}
          placedComponents={ohmsLaw.placedComponents}
          onPlace={placeOhmsComponent}
        />
      )}

      {/* Ammeter */}
      <Meter
        position={[tablePos[0] + 1.2, 1.15, tablePos[2] - 0.3]}
        label="Ammeter"
        value={current * 1000}
        maxValue={200}
        unit="mA"
        color="#cc0000"
      />

      {/* Voltmeter */}
      <Meter
        position={[tablePos[0] - 1.2, 1.15, tablePos[2] - 0.3]}
        label="Voltmeter"
        value={ohmsLaw.switchClosed ? ohmsLaw.voltage : 0}
        maxValue={15}
        unit="V"
        color="#0066cc"
      />

      {/* ── 3D Switch Key Toggle Button on Table ── */}
      {ohmsLaw.circuitBuilt && (
        <group
          position={[tablePos[0] - 0.3, 1.05, tablePos[2] + 0.3]}
          userData={{
            interactable: true,
            promptText: `${ohmsLaw.switchClosed ? 'Open Switch Key ⚡' : 'Close Switch Key ⚡'}`,
            onInteract: toggleOhmsSwitch,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.26, 0.06, 0.14]} />
            <meshStandardMaterial
              color={ohmsLaw.switchClosed ? '#10b981' : '#f59e0b'}
              emissive={ohmsLaw.switchClosed ? '#10b981' : '#f59e0b'}
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      )}

      {/* ── 3D Rheostat / Voltage Knob on Table ── */}
      {ohmsLaw.switchClosed && (
        <group
          position={[tablePos[0] + 0.15, 1.05, tablePos[2] + 0.3]}
          userData={{
            interactable: true,
            promptText: `Adjust Voltage (+2V) [Current: ${ohmsLaw.voltage}V]`,
            onInteract: cycleVoltage,
          }}
        >
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.07, 16]} />
            <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#0284c7" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* ── Take Reading button ── */}
      {ohmsLaw.switchClosed && !ohmsLaw.submitted && (
        <group
          position={[tablePos[0] + 0.6, 1.08, tablePos[2] + 0.3]}
          userData={{
            interactable: true,
            promptText: `Take V-I Reading #${ohmsLaw.readings.length + 1} (${ohmsLaw.voltage}V, ${(current * 1000).toFixed(1)}mA)`,
            onInteract: takeOhmsReading,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.34, 0.07, 0.16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* ── Submit button (after 3+ readings) ── */}
      {ohmsLaw.readings.length >= 3 && !ohmsLaw.submitted && (
        <group
          position={[tablePos[0], 1.12, tablePos[2] + 0.5]}
          userData={{
            interactable: true,
            promptText: `Submit ${ohmsLaw.readings.length} V-I Readings & Calculate R ✓`,
            onInteract: handleSubmit,
          }}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.45, 0.08, 0.18]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
