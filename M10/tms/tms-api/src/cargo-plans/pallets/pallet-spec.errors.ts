import type { Weight } from '../../shared/weight';

export class UnknownPalletTypeError extends Error {
  constructor(type: string, allowed: string[]) {
    super(`Unknown pallet type: '${type}'. Allowed: ${allowed.join(', ')}`);
    this.name = 'UnknownPalletTypeError';
  }
}

export class PalletWeightExceedsCapacityError {
  readonly kind = 'PalletWeightExceedsCapacityError' as const;
  readonly message: string;
  constructor(readonly actual: Weight, readonly max: Weight, readonly palletLabel: string) {
    this.message = `Weight ${actual.valueInKg}kg exceeds ${palletLabel} capacity (${max.valueInKg}kg)`;
  }
}

export class PalletCargoTypeNotAllowedError {
  readonly kind = 'PalletCargoTypeNotAllowedError' as const;
  readonly message: string;
  constructor(readonly cargoType: string, readonly palletLabel: string) {
    this.message = `Cargo type ${cargoType} is not allowed on ${palletLabel}`;
  }
}

export type PalletDomainError =
  | PalletWeightExceedsCapacityError
  | PalletCargoTypeNotAllowedError;
