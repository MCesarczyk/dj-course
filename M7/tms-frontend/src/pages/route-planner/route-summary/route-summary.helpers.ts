import { RoutePoint } from '../../../model/shipments';

export const getEarliestETA = (points: RoutePoint[]): Date | undefined =>
  points
    .filter(p => p.estimatedArrival)
    .map(p => p.estimatedArrival!)
    .sort((a, b) => a.getTime() - b.getTime())[0];

export const getLatestETD = (points: RoutePoint[]): Date | undefined =>
  points
    .filter(p => p.estimatedDeparture)
    .map(p => p.estimatedDeparture!)
    .sort((a, b) => b.getTime() - a.getTime())[0];
