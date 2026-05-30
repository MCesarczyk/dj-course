import React from 'react';
import { Driver } from '../../../model/drivers';
import { Vehicle as VehicleType } from '../../../model/vehicles';

export type RouteContext = 'active-shipments' | 'driver-routes' | 'vehicle-routes' | 'route-planning';

export interface ContextOption {
  value: RouteContext;
  label: string;
  icon: React.ReactNode;
}

export interface EntitySuggestion {
  id: string;
  name: string;
  type: 'driver' | 'vehicle';
  entity: Driver | VehicleType;
}
