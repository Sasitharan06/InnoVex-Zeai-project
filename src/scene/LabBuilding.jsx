import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Reusable wall material
const wallMat = new THREE.MeshStandardMaterial({ color: '#e2e0d8', roughness: 0.9, metalness: 0 });
const floorMat = new THREE.MeshStandardMaterial({ color: '#3a3d45', roughness: 0.7, metalness: 0.1 });
const ceilingMat = new THREE.MeshStandardMaterial({ color: '#f5f0e8', roughness: 1, metalness: 0 });
const doorFrameMat = new THREE.MeshStandardMaterial({ color: '#5a4e3c', roughness: 0.6, metalness: 0.1 });
const labTableMat = new THREE.MeshStandardMaterial({ color: '#2a2d35', roughness: 0.4, metalness: 0.3 });
const shelfMat = new THREE.MeshStandardMaterial({ color: '#4a4035', roughness: 0.5, metalness: 0.1 });

function Wall({ position, size, material, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={rotation} material={material || wallMat} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

function RoomSign({ position, text, color }) {
  return (
    <group position={position}>
      {/* Outer border/frame */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[3.2, 0.75]} />
        <meshStandardMaterial color="#111111" roughness={0.7} />
      </mesh>
      {/* Board background */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[3.1, 0.65]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Colored Board inner plate */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[3.0, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Bold Black Text */}
      <Text
        position={[0, 0, 0.02]}
        fontSize={0.25}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {text}
      </Text>
    </group>
  );
}

function LabTable({ position, size = [3, 0.1, 1.5] }) {
  return (
    <group position={position}>
      {/* Tabletop */}
      <mesh position={[0, 0.9, 0]} material={labTableMat} castShadow receiveShadow>
        <boxGeometry args={size} />
      </mesh>
      {/* Legs */}
      {[
        [-(size[0] / 2 - 0.1), 0.45, -(size[2] / 2 - 0.1)],
        [(size[0] / 2 - 0.1), 0.45, -(size[2] / 2 - 0.1)],
        [-(size[0] / 2 - 0.1), 0.45, (size[2] / 2 - 0.1)],
        [(size[0] / 2 - 0.1), 0.45, (size[2] / 2 - 0.1)],
      ].map((pos, i) => (
        <mesh key={i} position={pos} material={labTableMat} castShadow>
          <boxGeometry args={[0.08, 0.9, 0.08]} />
        </mesh>
      ))}
      {/* Shelf under */}
      <mesh position={[0, 0.3, 0]} material={shelfMat} receiveShadow>
        <boxGeometry args={[size[0] - 0.4, 0.04, size[2] - 0.3]} />
      </mesh>
    </group>
  );
}

function Shelving({ position }) {
  return (
    <group position={position}>
      {[0, 0.5, 1.0, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y + 0.6, 0]} material={shelfMat} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.05, 0.4]} />
        </mesh>
      ))}
      {/* Uprights */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 1.3, 0]} material={shelfMat} castShadow>
          <boxGeometry args={[0.05, 1.5, 0.35]} />
        </mesh>
      ))}
    </group>
  );
}

export default function LabBuilding() {
  const wallHeight = 3.5;
  const wallThick = 0.2;
  const floorY = 0;

  return (
    <group>
      {/* ── FLOOR ─────────────────────────────────────────── */}
      <mesh position={[0, floorY - 0.05, -7]} material={floorMat} receiveShadow>
        <boxGeometry args={[30, 0.1, 28]} />
      </mesh>

      {/* ── CEILING ────────────────────────────────────────── */}
      <mesh position={[0, wallHeight, -7]} material={ceilingMat}>
        <boxGeometry args={[30, 0.1, 28]} />
      </mesh>

      {/* ── OUTER WALLS ────────────────────────────────────── */}
      {/* Back wall */}
      <Wall position={[0, wallHeight / 2, -20]} size={[30, wallHeight, wallThick]} />
      {/* Front wall - left */}
      <Wall position={[-9, wallHeight / 2, 6]} size={[12, wallHeight, wallThick]} />
      {/* Front wall - right */}
      <Wall position={[9, wallHeight / 2, 6]} size={[12, wallHeight, wallThick]} />
      {/* Front wall - above door */}
      <Wall position={[0, wallHeight - 0.5, 6]} size={[6, 1, wallThick]} />
      {/* Left wall */}
      <Wall position={[-14, wallHeight / 2, -7]} size={[wallThick, wallHeight, 28]} />
      {/* Right wall */}
      <Wall position={[14, wallHeight / 2, -7]} size={[wallThick, wallHeight, 28]} />

      {/* ── DIVIDING WALLS (hallway to rooms) ──────────────── */}
      {/* Left divider - chemistry side (with doorway) */}
      <Wall position={[-9.5, wallHeight / 2, -2]} size={[9, wallHeight, wallThick]} />
      {/* Doorway left */}
      <Wall position={[-3.5, wallHeight - 0.5, -2]} size={[3, 1, wallThick]} />
      {/* Door frame left */}
      <Wall position={[-3.5, 1.3, -2]} size={[0.15, 2.6, wallThick + 0.05]} material={doorFrameMat} />
      <Wall position={[-5, 1.3, -2]} size={[0.15, 2.6, wallThick + 0.05]} material={doorFrameMat} />

      {/* Right divider - physics side (with doorway) */}
      <Wall position={[9.5, wallHeight / 2, -2]} size={[9, wallHeight, wallThick]} />
      {/* Doorway right */}
      <Wall position={[3.5, wallHeight - 0.5, -2]} size={[3, 1, wallThick]} />
      {/* Door frame right */}
      <Wall position={[3.5, 1.3, -2]} size={[0.15, 2.6, wallThick + 0.05]} material={doorFrameMat} />
      <Wall position={[5, 1.3, -2]} size={[0.15, 2.6, wallThick + 0.05]} material={doorFrameMat} />

      {/* Center dividing wall between rooms */}
      <Wall position={[0, wallHeight / 2, -11]} size={[wallThick, wallHeight, 18]} />

      {/* ── CHEMISTRY ROOM FURNITURE ───────────────────────── */}
      {/* Main experiment table */}
      <LabTable position={[-8, 0, -10]} size={[4, 0.1, 1.8]} />
      {/* Side table */}
      <LabTable position={[-4, 0, -16]} size={[3, 0.1, 1.2]} />
      {/* Shelving */}
      <Shelving position={[-12, 0, -18]} />

      {/* ── PHYSICS ROOM FURNITURE ─────────────────────────── */}
      {/* Main workbench */}
      <LabTable position={[8, 0, -10]} size={[4, 0.1, 1.8]} />
      {/* Component table */}
      <LabTable position={[4, 0, -16]} size={[3, 0.1, 1.2]} />
      {/* Shelving */}
      <Shelving position={[12, 0, -18]} />

      {/* ── HALLWAY FURNITURE ──────────────────────────────── */}
      {/* Bench */}
      <mesh position={[0, 0.4, 3]} material={labTableMat} castShadow receiveShadow>
        <boxGeometry args={[3, 0.08, 0.6]} />
      </mesh>
      <mesh position={[-1.2, 0.2, 3]} material={labTableMat} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.5]} />
      </mesh>
      <mesh position={[1.2, 0.2, 3]} material={labTableMat} castShadow>
        <boxGeometry args={[0.08, 0.4, 0.5]} />
      </mesh>

      {/* ── ROOM SIGNS ─────────────────────────────────────── */}
      <RoomSign position={[-4.25, 2.8, -1.89]} text="Chemistry Lab" color="#06b6d4" />
      <RoomSign position={[4.25, 2.8, -1.89]} text="Physics Lab" color="#f97316" />

      {/* ── FLOOR DETAILS ──────────────────────────────────── */}
      {/* Hallway floor marking */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#4a4d55" roughness={0.8} />
      </mesh>

      {/* Chemistry floor tint */}
      <mesh position={[-8, 0.01, -11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 17]} />
        <meshStandardMaterial color="#2a3540" roughness={0.7} transparent opacity={0.5} />
      </mesh>

      {/* Physics floor tint */}
      <mesh position={[8, 0.01, -11]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 17]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.7} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
