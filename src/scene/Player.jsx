import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useGameStore from '../store/gameStore';

const SPEED = 5;
const PLAYER_HEIGHT = 1.6;

// Room bounds (AABB collision)
const BOUNDS = {
  minX: -14,
  maxX: 14,
  minZ: -20,
  maxZ: 6,
};

// Room detection zones
const ROOMS = {
  chemistry: { minX: -14, maxX: -2, minZ: -20, maxZ: -2 },
  physics: { minX: 2, maxX: 14, minZ: -20, maxZ: -2 },
  hallway: { minX: -14, maxX: 14, minZ: -2, maxZ: 6 },
};

export default function Player() {
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  const setCurrentRoom = useGameStore((s) => s.setCurrentRoom);
  const interactablesRef = useRef([]);
  const setInteractionPrompt = useGameStore((s) => s.setInteractionPrompt);
  const heldItem = useGameStore((s) => s.heldItem);
  const chatOpen = useGameStore((s) => s.chatOpen);
  
  const direction = useRef(new THREE.Vector3());
  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 4);
    camera.lookAt(0, PLAYER_HEIGHT, 0);
  }, [camera]);

  const lastValidPromptRef = useRef(null);

  // E key & Space & Enter interaction handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (chatOpen) return;
      const key = e.key ? e.key.toLowerCase() : '';
      if (key === 'e' || e.code === 'KeyE' || key === 'enter' || key === ' ') {
        const prompt = useGameStore.getState().interactionPrompt || lastValidPromptRef.current;
        if (prompt && prompt.action) {
          prompt.action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen]);

  useFrame((state, delta) => {
    if (chatOpen) return;
    const { forward, backward, left, right } = get();

    // Movement
    frontVector.current.set(0, 0, Number(backward) - Number(forward));
    sideVector.current.set(Number(left) - Number(right), 0, 0);
    
    direction.current
      .subVectors(frontVector.current, sideVector.current)
      .normalize()
      .multiplyScalar(SPEED * delta)
      .applyEuler(camera.rotation);
    
    // Keep Y constant (no flying)
    direction.current.y = 0;

    const newX = camera.position.x + direction.current.x;
    const newZ = camera.position.z + direction.current.z;

    // AABB bounds check
    camera.position.x = Math.max(BOUNDS.minX + 0.5, Math.min(BOUNDS.maxX - 0.5, newX));
    camera.position.z = Math.max(BOUNDS.minZ + 0.5, Math.min(BOUNDS.maxZ - 0.5, newZ));
    camera.position.y = PLAYER_HEIGHT;

    // Determine current room
    const px = camera.position.x;
    const pz = camera.position.z;
    let room = 'hallway';
    if (px >= ROOMS.chemistry.minX && px <= ROOMS.chemistry.maxX && pz >= ROOMS.chemistry.minZ && pz <= ROOMS.chemistry.maxZ) {
      room = 'chemistry';
    } else if (px >= ROOMS.physics.minX && px <= ROOMS.physics.maxX && pz >= ROOMS.physics.minZ && pz <= ROOMS.physics.maxZ) {
      room = 'physics';
    }
    setCurrentRoom(room);

    // Raycast for interactions (increased far distance to 5.5m)
    raycaster.current.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
    raycaster.current.far = 5.5;
    
    const scene = state.scene;
    const interactables = [];
    scene.traverse((child) => {
      if (child.userData && child.userData.interactable) {
        interactables.push(child);
      }
    });

    const intersects = raycaster.current.intersectObjects(interactables, true);
    
    if (intersects.length > 0) {
      // Find the closest interactable parent
      let obj = intersects[0].object;
      while (obj && !obj.userData?.interactable) {
        obj = obj.parent;
      }
      if (obj && obj.userData.interactable) {
        const data = obj.userData;
        const promptData = {
          text: data.promptText || 'Interact',
          action: data.onInteract || (() => {}),
        };
        setInteractionPrompt(promptData);
        lastValidPromptRef.current = promptData;
      }
    } else {
      setInteractionPrompt(null);
    }
  });

  return null;
}
