import React from 'react';
import { Shipment } from '../../../model/shipments';
import { Clock, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

export const getPriorityColor = (priority: Shipment['priority']): string => {
  const colors: Record<Shipment['priority'], string> = {
    low:    'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high:   'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority];
};

export const getStatusIcon = (status: string): React.ReactElement => {
  switch (status) {
    case 'active':    return <Truck className="w-4 h-4 text-green-600" />;
    case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
    case 'delayed':   return <AlertTriangle className="w-4 h-4 text-red-600" />;
    default:          return <Clock className="w-4 h-4 text-gray-600" />;
  }
};
