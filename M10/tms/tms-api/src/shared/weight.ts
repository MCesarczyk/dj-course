export type WeightUnit = 'KG' | 'TONNE' | 'LB';

interface UnitDefinition {
  readonly factorToKg: number;
  readonly symbol: string;
}

const UNITS: Record<WeightUnit, UnitDefinition> = {
  KG:    { factorToKg: 1,           symbol: 'kg' },
  TONNE: { factorToKg: 1000,        symbol: 't'  },
  LB:    { factorToKg: 0.45359237,  symbol: 'lb' },
};

export class Weight {
  static readonly allowedUnits: WeightUnit[] = Object.keys(UNITS) as WeightUnit[];

  static isUnit(raw: unknown): raw is WeightUnit {
    return typeof raw === 'string' && Object.keys(UNITS).includes(raw);
  }

  static parseUnit(raw: unknown): WeightUnit {
    return Weight.isUnit(raw) ? raw : 'KG';
  }

  private constructor(
    private readonly amount: number,
    private readonly unit: WeightUnit
  ) {}

  static from(amount: number, unit: WeightUnit): Weight {
    if (amount < 0) throw new Error('Weight cannot be negative');
    return new Weight(amount, unit);
  }

  static zero(): Weight {
    return new Weight(0, 'KG');
  }

  /** Result keeps the unit of the left operand. */
  add(other: Weight): Weight {
    return new Weight(this.amount + other.valueInUnit(this.unit), this.unit);
  }

  isGreaterThan(other: Weight): boolean {
    return this.valueInKg > other.valueInKg;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  get valueInKg(): number {
    return this.amount * UNITS[this.unit].factorToKg;
  }

  valueInUnit(targetUnit: WeightUnit): number {
    return this.valueInKg / UNITS[targetUnit].factorToKg;
  }

  toUnit(targetUnit: WeightUnit): Weight {
    return new Weight(this.valueInUnit(targetUnit), targetUnit);
  }

  equals(other: Weight): boolean {
    // Using an epsilon to handle floating point precision issues across systems
    const EPSILON = 0.0000001;
    return Math.abs(this.valueInKg - other.valueInKg) < EPSILON;
  }

  toString(): string {
    const symbol = UNITS[this.unit].symbol;
    return `${this.amount} ${symbol}`;
  }
}
