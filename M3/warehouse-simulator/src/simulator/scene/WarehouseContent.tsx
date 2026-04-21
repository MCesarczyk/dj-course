import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { warehouseMap } from '../warehouseMap';
import { getWorldPosition } from '../model/warehouse-utilities';
import { TILE_TYPES } from '../model/warehouse.types';
import { Rack } from '../elements/Rack';
import { Dock } from '../elements/Dock';
import { FloorTile } from '../elements/FloorTile';
import { HangingLamp } from '../elements/HangingLamp';
import { Soldier, SoldierRef } from '../characters/Soldier';

const SOLDIER_POSITIONS = [
  { row: 5, col: 11 },
  { row: 3, col: 11 },
  { row: 4, col: 8 },
  { row: 7, col: 14 },
  { row: 7, col: 3 },
  { row: 10, col: 14 },
  { row: 10, col: 3 },
  { row: 11, col: 11 },
  { row: 2, col: 17 },
  { row: 5, col: 17 },
  { row: 8, col: 17 },
  { row: 11, col: 17 },
];

export interface SoldierMapData {
  x: number;
  z: number;
  isDead: boolean;
}

export interface WarehouseContentRef {
  killRandomSoldier: () => void;
  /** Cast a ray from (originX, originZ) in direction (dirX, dirZ). Returns true if a soldier was hit. */
  shoot: (originX: number, originZ: number, dirX: number, dirZ: number) => boolean;
  getLivingSoldierCount: () => number;
  /** Current world positions of all soldiers (for minimap). */
  getSoldierData: () => SoldierMapData[];
}

export const WarehouseContent = forwardRef<WarehouseContentRef, {}>((props, ref) => {
  const structure = warehouseMap.getStructure();
  const soldierRefs = useRef<(SoldierRef | null)[]>([]);

  useImperativeHandle(ref, () => ({
    killRandomSoldier: () => {
      const living = soldierRefs.current.filter(s => s && !s.isDead());
      if (living.length > 0) {
        const pick = Math.floor(Math.random() * living.length);
        living[pick]?.die();
      }
    },

    shoot: (originX: number, originZ: number, dirX: number, dirZ: number): boolean => {
      const HIT_RADIUS = 1.2; // world units — generous enough for fun gameplay
      const MAX_RANGE = 60;
      let closestT = MAX_RANGE;
      let closestSoldier: (typeof soldierRefs.current)[number] = null;

      for (const soldier of soldierRefs.current) {
        if (!soldier || soldier.isDead()) continue;
        const { x, z } = soldier.getPosition();

        // Ray–cylinder intersection on the XZ plane (height ignored, soldiers are wide targets)
        const ocX = originX - x;
        const ocZ = originZ - z;
        const b = ocX * dirX + ocZ * dirZ;
        const c = ocX * ocX + ocZ * ocZ - HIT_RADIUS * HIT_RADIUS;
        const discriminant = b * b - c;

        if (discriminant >= 0) {
          const t = -b - Math.sqrt(discriminant);
          if (t > 0 && t < closestT) {
            closestT = t;
            closestSoldier = soldier;
          }
        }
      }

      if (closestSoldier) {
        closestSoldier.die();
        return true;
      }
      return false;
    },

    getLivingSoldierCount: () =>
      soldierRefs.current.filter(s => s && !s.isDead()).length,

    getSoldierData: () =>
      soldierRefs.current
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map(s => ({
          x: s.getPosition().x,
          z: s.getPosition().z,
          isDead: s.isDead(),
        })),
  }));

  return (
    <group>
      {/* Warehouse tiles */}
      {(() => {
        // Build a sorted list of unique zone names for consistent color assignment
        const uniqueZones = Array.from(new Set(
          structure.grid.flat().filter(tile => tile.zone).map(tile => tile.zone as string)
        )).sort();
        return structure.grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const worldPos = getWorldPosition(rowIndex, colIndex);
            const position: [number, number, number] = [worldPos.x, 0, worldPos.z];

            if (tile.type === TILE_TYPES.RACK && tile.zone) {
              const zoneIndex = uniqueZones.indexOf(tile.zone);
              // Determine which directions have an adjacent aisle (strict rule)
              const labelDirections: Array<'north' | 'south' | 'east' | 'west'> = [];
              
              // Check each direction for adjacent aisle
              const northTile = warehouseMap.getTile(rowIndex + 1, colIndex);
              if (northTile && northTile.type === TILE_TYPES.AISLE) {
                labelDirections.push('north');
              }
              
              const southTile = warehouseMap.getTile(rowIndex - 1, colIndex);
              if (southTile && southTile.type === TILE_TYPES.AISLE) {
                labelDirections.push('south');
              }
              
              const eastTile = warehouseMap.getTile(rowIndex, colIndex + 1);
              if (eastTile && eastTile.type === TILE_TYPES.AISLE) {
                labelDirections.push('east');
              }
              
              const westTile = warehouseMap.getTile(rowIndex, colIndex - 1);
              if (westTile && westTile.type === TILE_TYPES.AISLE) {
                labelDirections.push('west');
              }
              const occupation = tile.capacity && tile.capacity.total ? tile.capacity.used / tile.capacity.total : 0;
              return (
                <Rack
                  key={`${rowIndex}-${colIndex}`}
                  position={position}
                  zone={tile.zone as 'A' | 'B' | 'C' | 'D' | 'E'}
                  zoneIndex={zoneIndex}
                  labelDirections={labelDirections}
                  occupation={occupation}
                />
              );
            } else if (tile.type === TILE_TYPES.DOCK) {
              return (
                <group key={`${rowIndex}-${colIndex}`}>
                  <FloorTile position={position} type="dock" />
                  <Dock position={position} />
                </group>
              );
            } else if (tile.type === TILE_TYPES.AISLE) {
              // Check if this is a lamp position (from original '+' character)
              const originalChar = warehouseMap.getStringMap()[rowIndex]?.[colIndex];
              const isLampPosition = originalChar === '+';
              
              return (
                <group key={`${rowIndex}-${colIndex}`}>
                  <FloorTile position={position} type="aisle" />
                  {isLampPosition && (
                    <HangingLamp 
                      position={[worldPos.x, 7.5, worldPos.z]} 
                      cableLength={2.5} 
                    />
                  )}
                </group>
              );
            }
            return null;
          })
        );
      })()}
      
      {/* Animated Soldiers */}
      {SOLDIER_POSITIONS.map((pos, index) => {
        const worldPos = getWorldPosition(pos.row, pos.col);
        return (
          <Soldier
            ref={el => soldierRefs.current[index] = el}
            key={`soldier-${index}`}
            position={[worldPos.x, 0, worldPos.z]}
          />
        );
      })}
    </group>
  );
});