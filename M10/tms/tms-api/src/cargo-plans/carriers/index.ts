export {
  type VehicleClass,
  type CarrierCapabilities,
  type CarrierSpec,
  type PalletLoadableCarrierSpec,
  isPalletLoadable,
  requiresTractor,
} from './carrier-spec';
export { CarrierFactory, UnknownCarrierTypeError } from './carrier-factory';
export { toCarrierReadModel } from './carrier.readmodel';
