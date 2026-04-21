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
const CAMERA_FOV_DEG = 75;

export const WarehouseScene: React.FC = () => {
  const [playerPosition, setPlayerPosition] = useState({
    x: INITIAL_PLAYER_POSITION?.x ?? 0,
    z: INITIAL_PLAYER_POSITION?.z ?? 0,
  });
  const [playerRotation, setPlayerRotation] = useState(INITIAL_PLAYER_ROTATION);
  const [killCount, setKillCount] = useState(0);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  const contentRef = useRef<WarehouseContentRef>(null);
  const shootCooldownRef = useRef(false);
  const pistolAudioRef = useRef<HTMLAudioElement | null>(null);

  // Always-fresh refs so callbacks never go stale
  const playerPositionRef = useRef(playerPosition);
  const playerRotationRef = useRef(playerRotation);
  const mousePosRef = useRef(mousePos);
  playerPositionRef.current = playerPosition;
  playerRotationRef.current = playerRotation;
  mousePosRef.current = mousePos;

  useEffect(() => {
    pistolAudioRef.current = new Audio('/assets/sounds/ATKPISTOLSND.WAV');
  }, []);

  const shoot = useCallback(() => {
    if (shootCooldownRef.current) return;
    shootCooldownRef.current = true;
    setTimeout(() => { shootCooldownRef.current = false; }, SHOOT_COOLDOWN_MS);

    // Play gunshot
    const audio = pistolAudioRef.current;
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }

    // Compute ray direction from mouse position in screen space.
    // The camera rotates only around Y (yaw), so we project mouse into world XZ plane.
    const rot = playerRotationRef.current;
    const { x: mx, y: my } = mousePosRef.current;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Normalised device coords: [-1, 1]
    const ndcX = (mx / w) * 2 - 1;
    // (ndcY not needed — camera has no pitch)

    // Camera local axes in world space
    const sinR = Math.sin(rot);
    const cosR = Math.cos(rot);
    const fwdX = -sinR;
    const fwdZ = -cosR;
    const rightX = cosR;
    const rightZ = -sinR; // wait: right = fwd cross up? Let me re-derive.
    // Right vector: rotate (1,0,0) by yaw = rot
    // R_y * (1,0,0) = (cos(rot), 0, -sin(rot))
    // but our rotation convention: fwd = (-sin(rot), 0, -cos(rot))
    // So right = (cos(rot), 0, -sin(rot)) — this is correct.

    // Horizontal half-extent in world-space units at distance 1
    const halfTanH = Math.tan((CAMERA_FOV_DEG / 2) * (Math.PI / 180)) * (w / h);

    // World-space direction (ignore vertical, flatten to XZ)
    const rawDirX = fwdX + rightX * ndcX * halfTanH;
    const rawDirZ = fwdZ + rightZ * ndcX * halfTanH;
    const len = Math.sqrt(rawDirX * rawDirX + rawDirZ * rawDirZ);

    const { x, z } = playerPositionRef.current;
    const hit = contentRef.current?.shoot(x, z, rawDirX / len, rawDirZ / len) ?? false;

    if (hit) setKillCount(k => k + 1);
    setFlash(hit ? 'hit' : 'miss');
    setTimeout(() => setFlash(null), 80);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); shoot(); }
      if (e.shiftKey && e.code === 'KeyD') contentRef.current?.killRandomSoldier();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shoot]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handlePositionChange = (pos: { x: number; z: number }, rot: number) => {
    setPlayerPosition(pos);
    setPlayerRotation(rot);
  };

  const remaining = TOTAL_SOLDIERS - killCount;

  return (
    <div
      className="w-full h-screen"
      style={{ cursor: 'none', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
      onClick={shoot}
    >
      <Canvas
        camera={{
          fov: CAMERA_FOV_DEG,
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

      {/* Screen flash on shoot */}
      {flash && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40,
          backgroundColor: flash === 'hit' ? 'rgba(255,30,30,0.18)' : 'rgba(255,255,220,0.08)',
        }} />
      )}

      {/* Custom reticle cursor — follows the mouse */}
      <svg
        style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          overflow: 'visible',
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
        }}
        width="44"
        height="44"
        viewBox="-22 -22 44 44"
      >
        {/* outer circle */}
        <circle cx="0" cy="0" r="14" fill="none" stroke="white" strokeWidth="1.5" opacity="0.85" />
        {/* gap lines (N / S / E / W) */}
        <line x1="0" y1="-22" x2="0" y2="-17" stroke="white" strokeWidth="1.5" opacity="0.85" />
        <line x1="0" y1="17" x2="0" y2="22" stroke="white" strokeWidth="1.5" opacity="0.85" />
        <line x1="-22" y1="0" x2="-17" y2="0" stroke="white" strokeWidth="1.5" opacity="0.85" />
        <line x1="17" y1="0" x2="22" y2="0" stroke="white" strokeWidth="1.5" opacity="0.85" />
        {/* centre dot */}
        <circle cx="0" cy="0" r="2.5" fill="#ff4444" opacity="0.95" />
      </svg>

      {/* Kill counter */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, pointerEvents: 'none', fontFamily: 'monospace', fontSize: 14,
        color: remaining === 0 ? '#4ade80' : '#f87171',
        backgroundColor: 'rgba(0,0,0,0.55)',
        padding: '4px 14px', borderRadius: 6, letterSpacing: 1,
        border: `1px solid ${remaining === 0 ? '#4ade80' : '#7f1d1d'}`,
      }}>
        {remaining === 0
          ? '★  MISSION COMPLETE  ★'
          : `☠  ${killCount} / ${TOTAL_SOLDIERS}  enemies eliminated`}
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, pointerEvents: 'none', fontFamily: 'monospace', fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
      }}>
        CLICK or SPACE to shoot · ARROWS to move · SHIFT for sprint
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
