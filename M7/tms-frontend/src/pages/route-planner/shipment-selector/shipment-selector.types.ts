import { Shipment } from '../../../model/shipments';

export interface ShipmentSelectorProps {
  shipments: Shipment[];
  selectedShipment: Shipment;
  onShipmentSelect: (shipment: Shipment) => void;
}
