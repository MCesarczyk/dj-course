import React from 'react';
import { Package } from 'lucide-react';
import { ShipmentSelectorProps } from './shipment-selector.types';
import { getPriorityColor, getStatusIcon } from './shipment-selector.helpers';

export const ShipmentSelector: React.FC<ShipmentSelectorProps> = ({
  shipments,
  selectedShipment,
  onShipmentSelect,
}) => (
  <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Package className="w-5 h-5 text-blue-600" />
      Active Shipments
    </h2>

    <div className="grid grid-cols-1 gap-3">
      {shipments.map((shipment) => (
        <button
          key={shipment.id}
          onClick={() => onShipmentSelect(shipment)}
          className={`p-3 rounded-lg border-2 transition-all text-left ${
            selectedShipment.id === shipment.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">{shipment.name}</h3>
            {getStatusIcon(shipment.route.status)}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{shipment.customer}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
              {shipment.priority.toUpperCase()}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {shipment.route.points.length} stops • {shipment.route.totalDistance.toFixed(0)} km
          </div>
        </button>
      ))}
    </div>
  </div>
);
