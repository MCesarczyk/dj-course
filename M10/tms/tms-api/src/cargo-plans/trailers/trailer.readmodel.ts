import type {
  TrailerReadModel,
  TrailerType,
} from '../../types/data-contracts';
import type { PalletLoadableTrailerSpec } from './trailer-spec';
import { TrailerFactory } from './trailer-factory';

export function toTrailerReadModel(trailer: PalletLoadableTrailerSpec): TrailerReadModel {
  return {
    // Expose the registry KEY (e.g. "mega"), matching TrailerType — not the
    // human-readable spec `type` ("Mega Trailer"), which the contract rejects.
    type: TrailerFactory.toTypeKey(trailer) as TrailerType,
    canCarryPallets: trailer.canCarryPallets,
    maxWeightCapacityKg: trailer.maxWeightCapacity.valueInKg,
    widthMm: trailer.widthMm,
    heightMm: trailer.heightMm,
    maxLdm: trailer.maxLdm,
  };
}
