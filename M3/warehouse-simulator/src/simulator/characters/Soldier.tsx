import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PositionalAudio } from '@react-three/drei';
import { SS_SOLDIER_CONFIG, ASSET_MAP } from './config';
import { SpriteAnimator } from './SpriteAnimator';
import { warehouseMap } from '../warehouseMap';
import { TILE_SIZE } from '../configuration';

const MIN_BURST_SHOTS = 1;
const MAX_BURST_SHOTS = 4;
const PATROL_SPEED = 1.5;       // world units / second
const ALERT_DISTANCE = 12;      // world units — triggers alert state
const ATTACK_DISTANCE = 7;      // world units — triggers attack state
const WAYPOINT_RADIUS = 4;      // tile search radius for next waypoint
const WAYPOINT_REACHED = 0.4;   // distance at which waypoint is considered reached
const ALERT_DURATION = 1.8;     // seconds to shout before attacking

type SoldierState = 'patrol' | 'alert' | 'attack' | 'dead';

interface SoldierProps {
  position: [number, number, number];
}

export interface SoldierRef {
  die: () => void;
  isDead: () => boolean;
}

// ---------- Chroma-key texture hook (unchanged) ----------

const useChromaKeyTexture = (config: typeof SS_SOLDIER_CONFIG) => {
  const texture = useLoader(THREE.TextureLoader, config.src);

  const processedTexture = useMemo(() => {
    const img = texture.image as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imgData.data;
    const tolerance = 30;

    for (let i = 0; i < data.length; i += 4) {
      let isBackground = false;
      const pixelR = data[i];
      const pixelG = data[i + 1];
      const pixelB = data[i + 2];

      for (const targetColor of config.removeColors) {
        const { r: tr, g: tg, b: tb } = targetColor;
        if (
          Math.abs(pixelR - tr) < tolerance &&
          Math.abs(pixelG - tg) < tolerance &&
          Math.abs(pixelB - tb) < tolerance
        ) {
          isBackground = true;
          break;
        }
      }

      if (isBackground) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.magFilter = THREE.NearestFilter;
    canvasTexture.minFilter = THREE.NearestFilter;
    canvasTexture.repeat.set(1 / config.cols, 1 / config.rows);
    return canvasTexture;
  }, [texture, config]);

  return processedTexture;
};

// ---------- Helpers ----------

/** Pick a random walkable tile within WAYPOINT_RADIUS tiles of the given world position. */
function pickRandomWaypoint(worldX: number, worldZ: number): THREE.Vector3 | null {
  const dim = warehouseMap.getDimensions();
  const centerCol = Math.floor((worldX + (dim.width * TILE_SIZE) / 2) / TILE_SIZE);
  const centerRow = Math.floor((worldZ + (dim.height * TILE_SIZE) / 2) / TILE_SIZE);

  const candidates: Array<{ row: number; col: number }> = [];
  for (let dr = -WAYPOINT_RADIUS; dr <= WAYPOINT_RADIUS; dr++) {
    for (let dc = -WAYPOINT_RADIUS; dc <= WAYPOINT_RADIUS; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = centerRow + dr;
      const c = centerCol + dc;
      if (warehouseMap.isWalkable(r, c)) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return new THREE.Vector3(
    (pick.col - dim.width / 2 + 0.5) * TILE_SIZE,
    0,
    (pick.row - dim.height / 2 + 0.5) * TILE_SIZE
  );
}

/**
 * Return the walk animation name based on the soldier's movement direction
 * relative to the camera's facing direction.
 *
 * Since the sprite is billboarded (always faces the camera), the animation
 * direction represents whether the soldier appears to walk toward, away from,
 * or sideways relative to the player's view.
 *
 *   walk-front  = soldier approaching the camera
 *   walk-back   = soldier moving away from the camera
 *   walk-right  = soldier crossing right in the player's field of view
 *   walk-left   = soldier crossing left in the player's field of view
 */
function getWalkAnimation(dx: number, dz: number, camera: THREE.Camera): string {
  if (Math.abs(dx) < 0.001 && Math.abs(dz) < 0.001) return 'idle';

  const soldierDir = new THREE.Vector3(dx, 0, dz).normalize();
  const camFwd = new THREE.Vector3();
  camera.getWorldDirection(camFwd);
  camFwd.y = 0;
  camFwd.normalize();

  const dot = soldierDir.dot(camFwd);
  const cross = new THREE.Vector3().crossVectors(camFwd, soldierDir).y;

  if (Math.abs(dot) >= Math.abs(cross)) {
    // Primarily moving along camera's forward axis
    return dot > 0 ? 'walk-back' : 'walk-front';
  } else {
    // Primarily moving laterally relative to the camera
    return cross > 0 ? 'walk-right' : 'walk-left';
  }
}

// ---------- Component ----------

export const Soldier = forwardRef<SoldierRef, SoldierProps>(({ position }, ref) => {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null!);

  // AI state — all kept in refs to avoid unnecessary re-renders
  const stateRef = useRef<SoldierState>('patrol');
  const posRef = useRef(new THREE.Vector3(position[0], 0, position[2]));
  const waypointRef = useRef<THREE.Vector3 | null>(null);
  const alertTimerRef = useRef(0);
  const alertPlayedRef = useRef(false);
  const isAttackingRef = useRef(false);
  const attackTimerRef = useRef(Math.random() * 3000); // stagger initial burst
  const burstShotsRef = useRef(0);
  const attackIntervalRef = useRef(3000 + Math.random() * 4000);

  const baseTexture = useChromaKeyTexture(SS_SOLDIER_CONFIG);
  const texture = useMemo(() => baseTexture?.clone(), [baseTexture]);

  // Audio buffers
  const deathSoundBuffers = useLoader(THREE.AudioLoader, [
    ASSET_MAP.scream_1, ASSET_MAP.scream_2, ASSET_MAP.scream_4,
    ASSET_MAP.scream_5, ASSET_MAP.scream_6, ASSET_MAP.scream_7,
    ASSET_MAP.scream_8, ASSET_MAP.scream_9,
  ]);

  const alertSoundBuffers = useLoader(THREE.AudioLoader, [
    ASSET_MAP.halt, ASSET_MAP.mein, ASSET_MAP.guten,
    ASSET_MAP.scheis, ASSET_MAP.eine, ASSET_MAP.nein,
    ASSET_MAP.spion, ASSET_MAP.erlauben,
  ]);

  const attackAudioRef = useRef<THREE.PositionalAudio>(null);
  const deathAudioRef = useRef<THREE.PositionalAudio>(null);
  const alertAudioRef = useRef<THREE.PositionalAudio>(null);

  const soundSystem = useMemo(() => ({
    playAttackSound: (shouldPlay: boolean) => {
      if (!attackAudioRef.current) return;
      if (shouldPlay && !attackAudioRef.current.isPlaying) {
        attackAudioRef.current.play();
      } else if (!shouldPlay && attackAudioRef.current.isPlaying) {
        attackAudioRef.current.stop();
      }
    },
    playDeathSound: () => {
      if (!deathAudioRef.current) return;
      const buf = deathSoundBuffers[Math.floor(Math.random() * deathSoundBuffers.length)];
      deathAudioRef.current.setBuffer(buf);
      if (!deathAudioRef.current.isPlaying) deathAudioRef.current.play();
    },
    playAlertSound: () => {
      if (!alertAudioRef.current) return;
      const buf = alertSoundBuffers[Math.floor(Math.random() * alertSoundBuffers.length)];
      alertAudioRef.current.setBuffer(buf);
      if (!alertAudioRef.current.isPlaying) alertAudioRef.current.play();
    },
  }), [deathSoundBuffers, alertSoundBuffers]);

  const animator = useMemo(() => {
    if (!texture) return null;
    return new SpriteAnimator(texture, SS_SOLDIER_CONFIG, soundSystem);
  }, [texture, soundSystem]);

  const die = () => {
    if (stateRef.current === 'dead' || !animator) return;
    stateRef.current = 'dead';
    animator.setSequence('death', false);
    soundSystem.playAttackSound(false);
    soundSystem.playDeathSound();
  };

  useImperativeHandle(ref, () => ({
    die,
    isDead: () => stateRef.current === 'dead',
  }));

  useFrame(({ clock }, delta) => {
    if (!animator || !meshRef.current) return;

    const soldierPos = posRef.current;
    const camPos = camera.position;
    const distToPlayer = Math.hypot(soldierPos.x - camPos.x, soldierPos.z - camPos.z);

    // ---- Dead ----
    if (stateRef.current === 'dead') {
      if (!animator.isFinished) animator.update(clock.elapsedTime * 1000);
      meshRef.current.position.set(soldierPos.x, 0.01, soldierPos.z);
      meshRef.current.lookAt(camPos);
      meshRef.current.rotation.x = -Math.PI / 2;
      return;
    }

    // Billboard toward camera (flat, no pitch/roll)
    meshRef.current.lookAt(camPos);
    meshRef.current.rotation.x = 0;
    meshRef.current.rotation.z = 0;

    animator.update(clock.elapsedTime * 1000);

    // ---- Transition: patrol → alert ----
    if (stateRef.current === 'patrol' && distToPlayer < ALERT_DISTANCE) {
      stateRef.current = 'alert';
      alertTimerRef.current = 0;
      alertPlayedRef.current = false;
    }

    // ---- Patrol ----
    if (stateRef.current === 'patrol') {
      if (!waypointRef.current) {
        waypointRef.current = pickRandomWaypoint(soldierPos.x, soldierPos.z);
      }

      const wp = waypointRef.current;
      if (wp) {
        const dx = wp.x - soldierPos.x;
        const dz = wp.z - soldierPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < WAYPOINT_REACHED) {
          waypointRef.current = null;
          animator.setSequence('idle', true);
        } else {
          const step = PATROL_SPEED * delta;
          soldierPos.x += (dx / dist) * step;
          soldierPos.z += (dz / dist) * step;

          const walkAnim = getWalkAnimation(dx, dz, camera);
          if (animator.currentSequenceName !== walkAnim) {
            animator.setSequence(walkAnim, true);
          }
        }
      } else {
        animator.setSequence('idle', true);
      }

      meshRef.current.position.set(soldierPos.x, SS_SOLDIER_CONFIG.scale / 2, soldierPos.z);
      return;
    }

    // ---- Alert ----
    if (stateRef.current === 'alert') {
      // Play German shout once per alert cycle
      if (!alertPlayedRef.current) {
        alertPlayedRef.current = true;
        soundSystem.playAlertSound();
      }

      // Face the player (walk-front = looking toward camera)
      animator.setSequence('walk-front', true);
      alertTimerRef.current += delta;

      if (alertTimerRef.current >= ALERT_DURATION) {
        if (distToPlayer < ATTACK_DISTANCE) {
          // Close enough — start shooting
          stateRef.current = 'attack';
          isAttackingRef.current = false;
          attackTimerRef.current = 0;
        } else if (distToPlayer >= ALERT_DISTANCE) {
          // Player retreated — go back to patrol
          stateRef.current = 'patrol';
          waypointRef.current = null;
        } else {
          // Still in alert zone but not close enough to attack — shout again
          alertTimerRef.current = 0;
          alertPlayedRef.current = false;
        }
      }

      meshRef.current.position.set(soldierPos.x, SS_SOLDIER_CONFIG.scale / 2, soldierPos.z);
      return;
    }

    // ---- Attack ----
    if (stateRef.current === 'attack') {
      // Player ran away — resume patrol
      if (distToPlayer > ALERT_DISTANCE + 2) {
        stateRef.current = 'patrol';
        waypointRef.current = null;
        isAttackingRef.current = false;
        soundSystem.playAttackSound(false);
        animator.setSequence('idle', true);
        meshRef.current.position.set(soldierPos.x, SS_SOLDIER_CONFIG.scale / 2, soldierPos.z);
        return;
      }

      if (isAttackingRef.current) {
        // Mid-burst: wait for animation to finish, then continue or end burst
        if (animator.isFinished) {
          if (burstShotsRef.current > 0) {
            burstShotsRef.current--;
            animator.setSequence('attack', false);
          } else {
            isAttackingRef.current = false;
            soundSystem.playAttackSound(false);
            animator.setSequence('idle', true);
            attackTimerRef.current = 0;
          }
        }
      } else {
        // Between bursts: count down to next burst
        attackTimerRef.current += delta * 1000;
        if (attackTimerRef.current >= attackIntervalRef.current) {
          const shots = Math.floor(Math.random() * (MAX_BURST_SHOTS - MIN_BURST_SHOTS + 1)) + MIN_BURST_SHOTS;
          burstShotsRef.current = shots - 1;
          isAttackingRef.current = true;
          animator.setSequence('attack', false);
          attackTimerRef.current = 0;
          attackIntervalRef.current = 3000 + Math.random() * 4000;
        }
      }

      meshRef.current.position.set(soldierPos.x, SS_SOLDIER_CONFIG.scale / 2, soldierPos.z);
    }
  });

  if (!texture) return null;

  const frameAspect =
    (texture.image.width / SS_SOLDIER_CONFIG.cols) /
    (texture.image.height / SS_SOLDIER_CONFIG.rows);
  const geometryArgs: [number, number] = [
    SS_SOLDIER_CONFIG.scale * frameAspect,
    SS_SOLDIER_CONFIG.scale,
  ];

  return (
    <mesh
      ref={meshRef}
      position={[position[0], SS_SOLDIER_CONFIG.scale / 2, position[2]]}
      rotation-order="YXZ"
    >
      <planeGeometry args={geometryArgs} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} alphaTest={0.5} />
      <PositionalAudio ref={attackAudioRef} url={ASSET_MAP.machine_gun_attack} loop distance={5} />
      <PositionalAudio ref={deathAudioRef} url={ASSET_MAP.scream_1} loop={false} distance={5} />
      <PositionalAudio ref={alertAudioRef} url={ASSET_MAP.halt} loop={false} distance={8} />
    </mesh>
  );
});
