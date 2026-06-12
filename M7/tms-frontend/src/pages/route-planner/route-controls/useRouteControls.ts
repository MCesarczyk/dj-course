import { useState } from 'react';
import { RoutePoint } from '../../../model/shipments';
import { PointTypeConfig, RouteControlsProps } from './route-controls.types';

const POINT_TYPES: PointTypeConfig[] = [
  { type: 'pickup',   label: 'Pickup Point',    icon: '📦', color: 'bg-green-50 hover:bg-green-100 border-green-200' },
  { type: 'delivery', label: 'Delivery Point',  icon: '🏭', color: 'bg-amber-50 hover:bg-amber-100 border-amber-200' },
  { type: 'rest',     label: 'Rest Stop',       icon: '🛏️', color: 'bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { type: 'fuel',     label: 'Fuel Station',    icon: '⛽', color: 'bg-red-50 hover:bg-red-100 border-red-200' },
  { type: 'border',   label: 'Border Crossing', icon: '🛂', color: 'bg-gray-50 hover:bg-gray-100 border-gray-200' },
];

export const useRouteControls = ({
  route,
  onAddPoint,
}: Pick<RouteControlsProps, 'route' | 'onAddPoint'>) => {
  const [showAddOptions, setShowAddOptions] = useState(false);

  const requiresRestStops = (): boolean => {
    const restStops = route.points.filter(p => p.type === 'rest').length;
    // EU regulation: 45min break after 4.5h driving, or every ~360km
    const required = Math.floor(Math.max(route.estimatedDuration / 270, route.totalDistance / 360));
    return required > restStops;
  };

  const getRestStopWarning = (): string | null => {
    const restStops = route.points.filter(p => p.type === 'rest').length;
    const required = Math.max(
      Math.floor(route.estimatedDuration / 270),
      Math.floor(route.totalDistance / 360)
    );
    if (required <= restStops) return null;
    const missing = required - restStops;
    return `This route requires ${missing} additional mandatory rest stop${missing > 1 ? 's' : ''} (EU regulation: 45min break every 4.5h driving)`;
  };

  const handleAddPoint = (type: RoutePoint['type']) => {
    onAddPoint(type);
    setShowAddOptions(false);
  };

  return {
    showAddOptions,
    setShowAddOptions,
    pointTypes: POINT_TYPES,
    requiresRestStops,
    getRestStopWarning,
    handleAddPoint,
  };
};
