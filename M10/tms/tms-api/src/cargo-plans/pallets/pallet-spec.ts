import { CargoType } from '../cargo/cargo.types';
import { Weight } from '../../shared/weight';
import { Length } from '../../shared/length';
import { UnknownPalletTypeError } from './pallet-spec.errors';

const mm = (value: number): Length => Length.from(value, 'MM');

export type Material = 'Wood' | 'Plastic' | 'Metal' | 'HDPE';

const REGISTRY: Record<string, () => PalletSpec> = {
  'epal1': () => PalletSpec.epal1(),
  'industrial': () => PalletSpec.industrial(),
  'half': () => PalletSpec.half(),
  'cp1': () => PalletSpec.cp1(),
  'cp3': () => PalletSpec.cp3(),
  'h1': () => PalletSpec.h1(),
};

/**
 * Immutable definition of a pallet type (Value Object).
 */
export class PalletSpec {
  static fromType(type: string): PalletSpec {
    const factory = REGISTRY[type];
    if (!factory) throw new UnknownPalletTypeError(type, Object.keys(REGISTRY));
    return factory();
  }

  static toTypeKey(spec: PalletSpec): string {
    const entry = Object.entries(REGISTRY).find(([, factory]) => factory().label === spec.label);
    if (!entry) throw new UnknownPalletTypeError(spec.label, Object.keys(REGISTRY));
    return entry[0];
  }

  static allowedTypes(): string[] {
    return Object.keys(REGISTRY);
  }

  constructor( // (!) 🤨🤨🤨 "public readonly" all the things?!
    public readonly label: string,
    public readonly material: Material,
    public readonly allowedCargoTypes: CargoType[],
    public readonly width: Length, // 🔥🔥🔥 Length VO: only domain-meaningful operations (add / compare / convert) are possible
    public readonly length: Length,
    /** Base height of the empty pallet */
    public readonly height: Length,
    public readonly maxLoadCapacity: Weight
  ) {
    this.validate();
    Object.freeze(this); // 🔥🔥🔥 immutability in runtime
  }

  isCargoTypeAllowed(cargoType: CargoType): boolean {
    return this.allowedCargoTypes.includes(cargoType);
  }

  isWeightExceeded(cargoWeight: Weight): boolean {
    return cargoWeight.valueInKg > this.maxLoadCapacity.valueInKg;
  }

  // 🔥🔥🔥 technical validation
  private validate(): void {
    if (!this.label || this.label.trim().length === 0) {
      throw new Error('Label cannot be empty');
    }
    if (!this.allowedCargoTypes || this.allowedCargoTypes.length === 0) {
      throw new Error('Pallet must have at least one allowed cargo type');
    }
    if (this.width.isZero() || this.length.isZero() || this.height.isZero()) {
      throw new Error('Dimensions must be positive values');
    }
    if (this.maxLoadCapacity.valueInKg <= 0) {
      throw new Error('Max load capacity must be a positive value');
    }
  }

  static epal1(): PalletSpec {
    return new PalletSpec('EPAL 1', 'Wood', [CargoType.GENERAL, CargoType.FOOD, CargoType.ELECTRONICS], mm(800), mm(1200), mm(144), Weight.from(4000, 'KG'));
  }

  static industrial(): PalletSpec {
    return new PalletSpec('ISO-2', 'Wood', [CargoType.GENERAL, CargoType.ELECTRONICS], mm(1000), mm(1200), mm(162), Weight.from(1500, 'KG'));
  }

  static half(): PalletSpec {
    return new PalletSpec('EPAL-6', 'Wood', [CargoType.GENERAL, CargoType.FOOD], mm(600), mm(800), mm(144), Weight.from(750, 'KG'));
  }

  static cp1(): PalletSpec {
    return new PalletSpec('CP1', 'Wood', [CargoType.CHEMICAL, CargoType.DANGEROUS_GOODS], mm(1000), mm(1200), mm(138), Weight.from(1190, 'KG'));
  }

  static cp3(): PalletSpec {
    return new PalletSpec('CP-3', 'Wood', [CargoType.CHEMICAL, CargoType.DANGEROUS_GOODS], mm(1140), mm(1140), mm(138), Weight.from(1200, 'KG'));
  }

  static h1(): PalletSpec {
    return new PalletSpec('H1', 'HDPE', [CargoType.FOOD], mm(800), mm(1200), mm(160), Weight.from(5000, 'KG'));
  }
}
