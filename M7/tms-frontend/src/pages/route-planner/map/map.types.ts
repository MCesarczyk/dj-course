import { Coordinates, RoutePoint, Vehicle } from '../../../model/shipments';

export interface LogisticsMapProps {
  points: RoutePoint[];
  vehicle: Vehicle;
  onPointAdd?: (coordinates: Coordinates, type: RoutePoint['type']) => void;
  onPointRemove?: (pointId: string) => void;
  onPointEdit?: (point: RoutePoint) => void;
  pendingPointType?: RoutePoint['type'] | null;
}
