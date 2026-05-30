import React from 'react';
import { RoutePoint } from '../../../model/shipments';

export interface DraggableRouteListProps {
  points: RoutePoint[];
  onReorderPoints: (newPoints: RoutePoint[]) => void;
}

export interface DraggableRoutePointProps {
  point: RoutePoint;
  index: number;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropIndex: number) => void;
}
