import type { Weight } from '../../shared/weight';
import type { Length } from '../../shared/length';
import type { Ldm } from '../ldm/ldm';

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
  constructor(readonly actual: Weight, readonly max: Weight, readonly tolerance: Weight) {
    this.message = `Weight capacity exceeded: ${actual.valueInKg}kg > ${max.valueInKg}kg (max allowed overload: ${tolerance.valueInKg}kg)`;
  }
}

export class LdmCapacityExceededError {
  readonly kind = 'LdmCapacityExceededError' as const;
  readonly message: string;
  constructor(readonly actual: Ldm, readonly max: Ldm) {
    this.message = `LDM capacity exceeded: ${actual.valueInMeters}m > ${max.valueInMeters}m`;
  }
}

export class CargoTooTallForCarrierError {
  readonly kind = 'CargoTooTallForCarrierError' as const;
  readonly message: string;
  constructor(
    readonly unitId: string,
    readonly unitHeight: Length,
    readonly carrierType: string,
    readonly carrierHeight: Length
  ) {
    this.message = `Unit ${unitId} is too tall (${unitHeight.valueIn('MM')}mm) for carrier ${carrierType} (${carrierHeight.valueIn('MM')}mm).`;
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
