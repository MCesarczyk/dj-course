export class PlanAlreadyFinalizedError {
  readonly kind = 'PlanAlreadyFinalizedError' as const;
  readonly message = 'Finalized plan cannot be modified.';
}

export class EmptyPlanError {
  readonly kind = 'EmptyPlanError' as const;
  readonly message = 'Cannot finalize empty plan.';
}

export class WeightCapacityExceededError {
  readonly kind = 'WeightCapacityExceededError' as const;
  readonly message: string;
  constructor(readonly actualKg: number, readonly maxKg: number, readonly toleranceKg: number) {
    this.message = `Weight capacity exceeded: ${actualKg}kg > ${maxKg}kg (max allowed overload: ${toleranceKg}kg)`;
  }
}

export class LdmCapacityExceededError {
  readonly kind = 'LdmCapacityExceededError' as const;
  readonly message: string;
  constructor(readonly actualLdm: number, readonly maxLdm: number) {
    this.message = `LDM capacity exceeded: ${actualLdm}m > ${maxLdm}m`;
  }
}

export class CargoTooTallForCarrierError {
  readonly kind = 'CargoTooTallForCarrierError' as const;
  readonly message: string;
  constructor(
    readonly unitId: string,
    readonly unitHeightMm: number,
    readonly carrierType: string,
    readonly carrierHeightMm: number
  ) {
    this.message = `Unit ${unitId} is too tall (${unitHeightMm}mm) for carrier ${carrierType} (${carrierHeightMm}mm).`;
  }
}

export class CarrierCapabilityMismatchError {
  readonly kind = 'CarrierCapabilityMismatchError' as const;
  readonly message: string;
  constructor(readonly reason: string) {
    this.message = `Carrier capability mismatch: ${reason}`;
  }
}

export class IncompatibleCargoColoadingError {
  readonly kind = 'IncompatibleCargoColoadingError' as const;
  readonly message = 'Incompatible cargo: Cannot mix Food with Dangerous goods.';
}

export class CargoUnitNotFoundError {
  readonly kind = 'CargoUnitNotFoundError' as const;
  readonly message: string;
  constructor(readonly unitId: string) {
    this.message = `Unit with ID ${unitId} not found.`;
  }
}

import {
  PalletWeightExceedsCapacityError,
  PalletCargoTypeNotAllowedError,
} from '../pallets/pallet-spec.errors';

export type { PalletWeightExceedsCapacityError, PalletCargoTypeNotAllowedError };

export type CargoLoadPlanDomainError =
  | PlanAlreadyFinalizedError
  | EmptyPlanError
  | WeightCapacityExceededError
  | LdmCapacityExceededError
  | CargoTooTallForCarrierError
  | CarrierCapabilityMismatchError
  | IncompatibleCargoColoadingError
  | CargoUnitNotFoundError
  | PalletWeightExceedsCapacityError
  | PalletCargoTypeNotAllowedError;
