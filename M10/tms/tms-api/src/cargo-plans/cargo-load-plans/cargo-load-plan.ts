import { CargoType, requirementsFor } from '../cargo/cargo.types';
import { CargoLoadPlanStatus } from './cargo-load-plan.types';
import { PalletUnit } from '../pallets/pallet-unit';
import { PalletSpec } from '../pallets/pallet-spec';
import type { PalletLoadableCarrierSpec } from '../carriers';
import { Weight } from '../../shared/weight';
import { Length } from '../../shared/length';
import { ok, fail, type Result } from '../../shared/result';
import { UUID } from '../../shared/uuid';
import {
  PlanAlreadyFinalizedError,
  EmptyPlanError,
  WeightCapacityExceededError,
  LdmCapacityExceededError,
  CargoTooTallForCarrierError,
  CarrierCapabilityMismatchError,
  IncompatibleCargoColoadingError,
  CargoUnitNotFoundError,
  type CargoLoadPlanDomainError,
} from './cargo-load-plan.errors';

export interface AddCargoData {
  palletType: string;
  cargoType: CargoType;
  weight: Weight;
  cargoHeight: Length;
}

export class CargoLoadPlan {
  // Business rule: DMC may be exceeded by at most 200 kg per whole transport plan
  private static readonly DMC_OVERLOAD_TOLERANCE_KG = 200;

  constructor(
    private readonly id: UUID<'CargoLoadPlan'>,
    private carrier: PalletLoadableCarrierSpec,
    private currentLdm: Length,
    private assignedUnits: PalletUnit[] = [],
    private status: CargoLoadPlanStatus = CargoLoadPlanStatus.DRAFT,
    private version: number = 0
  ) {
    this.assignedUnits = [...assignedUnits];

    // 🔥🔥🔥 Validate invariants on reconstruction – throw because corrupt state from DB is unexpected
    const integrityResult = this.ensureLoadIntegrity(this.assignedUnits, this.carrier, this.currentLdm);
    if (!integrityResult.success) throw integrityResult.error;
  }

  public getSnapshot() {
    return {
      id: this.id,
      carrier: this.carrier,
      status: this.status,
      currentLdm: this.currentLdm,
      assignedUnits: Object.freeze(this.assignedUnits.map(u => u.getSnapshot())),
      version: this.version,
    };
  }

  public finalize(): Result<void, PlanAlreadyFinalizedError | EmptyPlanError | LdmCapacityExceededError> {
    const guardResult = this.ensurePlanNotFinalized();
    if (!guardResult.success) return guardResult;

    if (this.assignedUnits.length === 0) return fail(new EmptyPlanError());

    if (this.currentLdm.isGreaterThan(this.carrier.maxLdm)) {
      return fail(new LdmCapacityExceededError(this.currentLdm.valueIn('M'), this.carrier.maxLdm.valueIn('M')));
    }

    this.status = CargoLoadPlanStatus.FINALIZED;
    return ok(undefined);
  }

  public addCargoToPlan(
    data: AddCargoData,
    // 🔥🔥🔥 strategy (not double dispatch)
    ldmProvider: (u: PalletUnit[], t: PalletLoadableCarrierSpec) => Length
  ): Result<void, CargoLoadPlanDomainError> {
    const guardResult = this.ensurePlanNotFinalized();
    if (!guardResult.success) return guardResult;

    const spec = PalletSpec.fromType(data.palletType);
    const requirements = requirementsFor(data.cargoType);

    const unitResult = PalletUnit.create(spec, data.cargoType, requirements, data.weight, data.cargoHeight);
    if (!unitResult.success) return fail(unitResult.error);

    const candidateUnits = [...this.assignedUnits, unitResult.value];
    const newLdm = ldmProvider(candidateUnits, this.carrier);
    const integrityResult = this.ensureLoadIntegrity(candidateUnits, this.carrier, newLdm);
    if (!integrityResult.success) return integrityResult;

    this.assignedUnits = candidateUnits;
    this.currentLdm = newLdm;
    return ok(undefined);
  }

  public removeCargoFromPlan(
    unitId: string,
    ldmProvider: (u: PalletUnit[], t: PalletLoadableCarrierSpec) => Length
  ): Result<void, CargoLoadPlanDomainError> {
    const guardResult = this.ensurePlanNotFinalized();
    if (!guardResult.success) return guardResult;

    const candidateUnits = this.assignedUnits.filter(u => u.getSnapshot().id !== unitId);
    if (candidateUnits.length === this.assignedUnits.length) {
      return fail(new CargoUnitNotFoundError(unitId));
    }

    const newLdm = ldmProvider(candidateUnits, this.carrier);
    const integrityResult = this.ensureLoadIntegrity(candidateUnits, this.carrier, newLdm);
    if (!integrityResult.success) return integrityResult;

    this.assignedUnits = candidateUnits;
    this.currentLdm = newLdm;
    return ok(undefined);
  }

  public replaceCarrier(
    newCarrier: PalletLoadableCarrierSpec,
    ldmProvider: (u: PalletUnit[], t: PalletLoadableCarrierSpec) => Length
  ): Result<void, CargoLoadPlanDomainError> {
    const guardResult = this.ensurePlanNotFinalized();
    if (!guardResult.success) return guardResult;

    const newLdm = ldmProvider(this.assignedUnits, newCarrier);
    const integrityResult = this.ensureLoadIntegrity(this.assignedUnits, newCarrier, newLdm);
    if (!integrityResult.success) return integrityResult;

    this.carrier = newCarrier;
    this.currentLdm = newLdm;
    return ok(undefined);
  }

  public isFinalized(): boolean {
    return this.status === CargoLoadPlanStatus.FINALIZED;
  }

  private ensurePlanNotFinalized(): Result<void, PlanAlreadyFinalizedError> {
    if (this.status === CargoLoadPlanStatus.FINALIZED) {
      return fail(new PlanAlreadyFinalizedError());
    }
    return ok(undefined);
  }

  private ensureLoadIntegrity(
    units: PalletUnit[],
    carrier: PalletLoadableCarrierSpec,
    ldm: Length
  ): Result<void, CargoLoadPlanDomainError> {
    if (units.length === 0) return ok(undefined);

    const weightResult = this.ensureWeightCapacityNotExceeded(units, carrier);
    if (!weightResult.success) return weightResult;

    const ldmResult = this.ensureLdmCapacityNotExceeded(ldm, carrier);
    if (!ldmResult.success) return ldmResult;

    const coloadResult = this.ensureCargoColoadingCompatibility(units);
    if (!coloadResult.success) return coloadResult;

    for (const unit of units) {
      const spatialResult = this.ensureCargoSpatialFit(unit, carrier);
      if (!spatialResult.success) return spatialResult;

      const capabilityResult = this.ensureCarrierSatisfiesCargoRequirements(unit, carrier);
      if (!capabilityResult.success) return capabilityResult;
    }

    return ok(undefined);
  }

  private ensureWeightCapacityNotExceeded(
    units: PalletUnit[],
    carrier: PalletLoadableCarrierSpec
  ): Result<void, CargoLoadPlanDomainError> {
    // 🤨🤨🤨 so unit's weight is of type Weight (VO) but their sum totalWeightKg is a primitive (number)?
    // (╯°□°)╯︵ ┻━┻ 
    const totalWeightKg = units.reduce((sum, u) => sum + u.getSnapshot().weight.valueInKg, 0);
    const maxAllowedKg = carrier.maxWeightCapacity.valueInKg + CargoLoadPlan.DMC_OVERLOAD_TOLERANCE_KG;
    if (totalWeightKg > maxAllowedKg) {
      return fail(
        new WeightCapacityExceededError(
          totalWeightKg,
          carrier.maxWeightCapacity.valueInKg,
          CargoLoadPlan.DMC_OVERLOAD_TOLERANCE_KG
        )
      );
    }
    return ok(undefined);
  }

  private ensureLdmCapacityNotExceeded(
    ldm: Length,
    carrier: PalletLoadableCarrierSpec
  ): Result<void, CargoLoadPlanDomainError> {
    if (ldm.isGreaterThan(carrier.maxLdm)) {
      return fail(new LdmCapacityExceededError(ldm.valueIn('M'), carrier.maxLdm.valueIn('M')));
    }
    return ok(undefined);
  }

  private ensureCargoSpatialFit(
    unit: PalletUnit,
    carrier: PalletLoadableCarrierSpec
  ): Result<void, CargoTooTallForCarrierError> {
    const { id, totalHeight } = unit.getSnapshot();
    if (totalHeight.isGreaterThan(carrier.height)) {
      return fail(new CargoTooTallForCarrierError(id, totalHeight.valueIn('MM'), carrier.type, carrier.height.valueIn('MM')));
    }
    return ok(undefined);
  }

  private ensureCarrierSatisfiesCargoRequirements(
    unit: PalletUnit,
    carrier: PalletLoadableCarrierSpec
  ): Result<void, CarrierCapabilityMismatchError> {
    const { requirements: req } = unit.getSnapshot();
    const { capabilities: cap } = carrier;

    if (req.isTemperatureControlled && !cap.hasClimateControl) {
      return fail(new CarrierCapabilityMismatchError('Climate control required'));
    }
    if (req.requiresSideLoading && !cap.supportsSideLoading) {
      return fail(new CarrierCapabilityMismatchError('side loading required'));
    }
    if (req.highSecurityRequired && !cap.hasHighSecurityLock) {
      return fail(new CarrierCapabilityMismatchError('high security lock required'));
    }
    if (req.isBulk && !cap.isBulkReady) {
      return fail(new CarrierCapabilityMismatchError('bulk-ready carrier required'));
    }

    return ok(undefined);
  }

  private ensureCargoColoadingCompatibility(
    units: PalletUnit[]
  ): Result<void, IncompatibleCargoColoadingError> {
    const hasDangerous = units.some(
      u => u.getSnapshot().cargoType === CargoType.CHEMICAL || u.getSnapshot().cargoType === CargoType.DANGEROUS_GOODS
    );
    const hasFood = units.some(u => u.getSnapshot().cargoType === CargoType.FOOD);

    if (hasFood && hasDangerous) {
      return fail(new IncompatibleCargoColoadingError());
    }
    return ok(undefined);
  }
}
