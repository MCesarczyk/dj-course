import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { CameraController } from './scene/CameraController';
import { WarehouseEnvironment } from './scene/WarehouseEnvironment';
import { Minimap } from './tooltips/Minimap';
import { WarehouseNavigation } from './tooltips/WarehouseNavigation';
import { INITIAL_PLAYER_POSITION } from './model/position';
import { INITIAL_PLAYER_ROTATION } from './configuration';
import { PCFSoftShadowMap } from 'three';
import { AudioControls } from './audio/AudioControls';
import { WarehouseContentRef } from './scene/WarehouseContent';

const TOTAL_SOLDIERS = 12;
const SHOOT_COOLDOWN_MS = 350;

export const WarehouseScene: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState({
    x: INITIAL_PLAYER_POSITION?.x ?? 0,
    z: INITIAL_PLAYER_POSITION?.z ?? 0,
  });
  const [playerRotation, setPlayerRotation] = useState(INITIAL_PLAYER_ROTATION);
  const [killCount, setKillCount] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);

  const contentRef = useRef<WarehouseContentRef>(null);
  const shootCooldownRef = useRef(false);
  const pistolAudioRef = useRef<HTMLAudioElement | null>(null);

  // Keep latest position/rotation in refs so the shoot handler never goes stale
  const playerPositionRef = useRef(playerPosition);
  const playerRotationRef = useRef(playerRotation);
  playerPositionRef.current = playerPosition;
  playerRotationRef.current = playerRotation;

  useEffect(() => {
    pistolAudioRef.current = new Audio('/assets/sounds/ATKPISTOLSND.WAV');
  }, []);

  const shoot = useCallback(() => {
    if (shootCooldownRef.current) return;
    shootCooldownRef.current = true;
    setTimeout(() => { shootCooldownRef.current = false; }, SHOOT_COOLDOWN_MS);

    // Play gunshot immediately
    const audio = pistolAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    // Ray direction from current rotation (0 = facing negative Z / north)
    const rot = playerRotationRef.current;
    const dirX = -Math.sin(rot);
    const dirZ = -Math.cos(rot);
    const { x, z } = playerPositionRef.current;

    const hit = contentRef.current?.shoot(x, z, dirX, dirZ) ?? false;

    if (hit) {
      setKillCount(k => k + 1);
      setFlash('hit');
    } else {
      setFlash('miss');
    }
    setTimeout(() => setFlash(null), 80);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        shoot();
      }
      if (event.shiftKey && event.code === 'KeyD') {
        contentRef.current?.killRandomSoldier();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shoot]);

  const handlePositionChange = (pos: { x: number; z: number }, rot: number) => {
    setPlayerPosition(pos);
    setPlayerRotation(rot);
  };

  const remaining = TOTAL_SOLDIERS - killCount;

  return (
    <div
      className="w-full h-screen"
      style={{ cursor: 'none' }}
      onClick={shoot}
    >
      <Canvas
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [
            INITIAL_PLAYER_POSITION?.x ?? 0,
            INITIAL_PLAYER_POSITION?.y ?? 0,
            INITIAL_PLAYER_POSITION?.z ?? 0,
          ],
        }}
        shadows={{ enabled: true, type: PCFSoftShadowMap }}
      >
        <CameraController onPositionChange={handlePositionChange} />
        <WarehouseEnvironment ref={contentRef} />
      </Canvas>

      {/* Muzzle flash / hit feedback overlay */}
      {flash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: flash === 'hit' ? 'rgba(255,30,30,0.18)' : 'rgba(255,255,220,0.10)',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        />
      )}

      {/* Crosshair */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          userSelect: 'none',
        }}
      >
        {/* top tick */}
        <div style={{ width: 2, height: 10, backgroundColor: 'rgba(255,255,255,0.85)' }} />
        {/* horizontal bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.85)' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'rgba(255,80,80,0.9)' }} />
          <div style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.85)' }} />
        </div>
        {/* bottom tick */}
        <div style={{ width: 2, height: 10, backgroundColor: 'rgba(255,255,255,0.85)' }} />
      </div>

      {/* Kill counter — top center */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
          fontFamily: 'monospace',
          fontSize: 14,
          color: remaining === 0 ? '#4ade80' : '#f87171',
          backgroundColor: 'rgba(0,0,0,0.55)',
          padding: '4px 14px',
          borderRadius: 6,
          letterSpacing: 1,
          border: `1px solid ${remaining === 0 ? '#4ade80' : '#991b1b'}`,
        }}
      >
        {remaining === 0
          ? '★  MISSION COMPLETE  ★'
          : `☠ ${killCount} / ${TOTAL_SOLDIERS}  enemies eliminated`}
      </div>

      {/* Controls hint — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          pointerEvents: 'none',
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        CLICK or SPACE to shoot · ARROWS to move · SHIFT+ARROWS to sprint/rotate faster
      </div>

      <Minimap playerPosition={playerPosition} playerRotation={playerRotation} />

      <div className="absolute top-4 left-4 z-50" style={{ width: 'max-content' }}>
        <div className="flex flex-col gap-2">
          <WarehouseNavigation />
          <AudioControls />
        </div>
      </div>
    </div>
  );
};
