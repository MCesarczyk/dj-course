import type {
  CarrierReadModel,
  CarrierType,
} from '../../types/data-contracts';
import type { PalletLoadableCarrierSpec } from './carrier-spec';
import { requiresTractor } from './carrier-spec';
import { CarrierFactory } from './carrier-factory';

export function toCarrierReadModel(carrier: PalletLoadableCarrierSpec): CarrierReadModel {
  return {
    // Expose the registry KEY (e.g. "box-truck"), matching CarrierType — not the
    // human-readable spec `type` ("Box Truck"), which the contract rejects.
    type: CarrierFactory.toTypeKey(carrier) as CarrierType,
    vehicleClass: carrier.vehicleClass,
    requiresTractor: requiresTractor(carrier),
    canCarryPallets: carrier.canCarryPallets,
    maxWeightCapacityKg: carrier.maxWeightCapacity.valueInKg,
    widthMm: carrier.widthMm,
    heightMm: carrier.heightMm,
    maxLdm: carrier.maxLdm,
  };
}
