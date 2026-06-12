import { RouteData, RoutePoint } from '../../../model/shipments';

export interface RouteControlsProps {
  route: RouteData;
  onAddPoint: (type: RoutePoint['type']) => void;
  onOptimizeRoute: () => void;
  onAddRestStops: () => void;
}

export interface PointTypeConfig {
  type: RoutePoint['type'];
  label: string;
  icon: string;
  color: string;
}
