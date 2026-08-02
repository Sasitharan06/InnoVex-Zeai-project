import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PointerLockControls, KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useGameStore from '../store/gameStore';
import Player from './Player';
import LabBuilding from './LabBuilding';
import ChemistryRoom from './chemistry/ChemistryRoom';
import PhysicsRoom from './physics/PhysicsRoom';
import HUD from '../ui/HUD';
import ReportModal from '../ui/ReportModal';
import ExperimentGuideModal from '../ui/ExperimentGuideModal';
import AIAssistant from '../ui/AIAssistant';

const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
];

function SceneLighting() {
  return (
    <>
      {/* Bright Ambient fill for high visibility */}
      <ambientLight intensity={1.2} color="#ffffff" />
      
      {/* Hallway overhead lights */}
      <pointLight position={[0, 3.5, 2]} intensity={3} distance={15} color="#ffffff" castShadow />
      <pointLight position={[-5, 3.5, 0]} intensity={2.5} distance={12} color="#ffffff" />
      <pointLight position={[5, 3.5, 0]} intensity={2.5} distance={12} color="#ffffff" />
      
      {/* Directional light for crisp shadows & specular reflections */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
    </>
  );
}

function LabContent() {
  return (
    <>
      <SceneLighting />
      <LabBuilding />
      <ChemistryRoom />
      <PhysicsRoom />
      <Player />
      
      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#0a0e1a', 8, 30]} />
    </>
  );
}

export default function LabScene() {
  const setPointerLocked = useGameStore((s) => s.setPointerLocked);
  const pointerLocked = useGameStore((s) => s.pointerLocked);
  const showGuideModal = useGameStore((s) => s.showGuideModal);
  const showReport = useGameStore((s) => s.showReport);
  const chatOpen = useGameStore((s) => s.chatOpen);
  const [showLockPrompt, setShowLockPrompt] = useState(true);
  const controlsRef = useRef();

  useEffect(() => {
    if ((showGuideModal || showReport || chatOpen) && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [showGuideModal, showReport, chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } else {
      // Re-acquire Pointer Lock automatically when chat is closed
      const canvas = document.querySelector('canvas');
      if (canvas && !showGuideModal && !showReport) {
        canvas.requestPointerLock?.();
      }
    }
  }, [chatOpen, showGuideModal, showReport]);

  const handleLock = () => {
    setPointerLocked(true);
    setShowLockPrompt(false);
  };
  
  const handleUnlock = () => {
    setPointerLocked(false);
    setShowLockPrompt(true);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <KeyboardControls map={keyMap}>
        <Canvas
          shadows
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          camera={{ fov: 70, near: 0.1, far: 100 }}
          style={{ background: '#0a0e1a' }}
        >
          <Suspense fallback={null}>
            <LabContent />
          </Suspense>
          <PointerLockControls
            ref={controlsRef}
            enabled={!chatOpen}
            onLock={handleLock}
            onUnlock={handleUnlock}
          />
        </Canvas>
      </KeyboardControls>

      {/* HUD overlays */}
      <HUD />

      {/* Report Modal */}
      <ReportModal />

      {/* Pre-Lab Experiment Guide Modal */}
      <ExperimentGuideModal />

      {/* VirtuLab AI Lab Mentor Chat */}
      <AIAssistant />

      {/* Click to lock prompt */}
      {!chatOpen && !pointerLocked && (
        <div className="lock-overlay" onClick={() => controlsRef.current?.lock()}>
          <h2>🔬 VirtuLab Virtual Laboratory</h2>
          <p>Click anywhere to enter the lab</p>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
            WASD to move • Mouse to look • E to interact • ESC to unlock
          </p>
        </div>
      )}
    </div>
  );
}
