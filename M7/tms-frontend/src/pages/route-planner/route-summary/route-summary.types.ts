import { RouteData } from '../../../model/shipments';

export interface RouteSummaryProps {
  route: RouteData;
  onReorderPoints?: (newPoints: RouteData['points']) => void;
  allowReordering?: boolean;
}
