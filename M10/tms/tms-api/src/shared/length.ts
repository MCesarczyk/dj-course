export type LengthUnit = 'MM' | 'CM' | 'M';

interface UnitDefinition {
  readonly factorToMm: number;
  readonly symbol: string;
}

const UNITS: Record<LengthUnit, UnitDefinition> = {
  MM: { factorToMm: 1,    symbol: 'mm' },
  CM: { factorToMm: 10,   symbol: 'cm' },
  M:  { factorToMm: 1000, symbol: 'm'  },
};

/**
 * A 1D spatial dimension (Value Object).
 *
 * Deliberately models ONLY a single linear extent. Every spatial rule in this
 * context (row width packing, LDM, height clearance) is expressed as sums,
 * maxima and comparisons of lengths — never as scalar area (m²) or volume (m³),
 * so those concepts are intentionally NOT modelled here.
 */
export class Length {
  static readonly allowedUnits: LengthUnit[] = Object.keys(UNITS) as LengthUnit[];

  private constructor(
    private readonly amount: number,
    private readonly unit: LengthUnit
  ) {}

  static from(amount: number, unit: LengthUnit): Length {
    if (!Number.isFinite(amount)) throw new Error('Length must be a finite number');
    if (amount < 0) throw new Error('Length cannot be negative');
    return new Length(amount, unit);
  }

  static zero(): Length {
    return new Length(0, 'MM');
  }

  /** Comparator for sorting (ascending). */
  static compare(a: Length, b: Length): number {
    return a.valueInMm - b.valueInMm;
  }

  static max(first: Length, ...rest: Length[]): Length {
    return rest.reduce((max, l) => (l.isGreaterThan(max) ? l : max), first);
  }

  get valueInMm(): number {
    return this.amount * UNITS[this.unit].factorToMm;
  }

  valueIn(targetUnit: LengthUnit): number {
    return this.valueInMm / UNITS[targetUnit].factorToMm;
  }

  toUnit(targetUnit: LengthUnit): Length {
    return new Length(this.valueIn(targetUnit), targetUnit);
  }

  /** Result keeps the unit of the left operand. */
  add(other: Length): Length {
    return new Length(this.amount + other.valueIn(this.unit), this.unit);
  }

  isGreaterThan(other: Length): boolean {
    return this.valueInMm > other.valueInMm;
  }

  /** True when this length does not exceed the available space. */
  fitsWithin(available: Length): boolean {
    return !this.isGreaterThan(available);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  equals(other: Length): boolean {
    // Using an epsilon to handle floating point precision issues across systems
    const EPSILON = 0.0000001;
    return Math.abs(this.valueInMm - other.valueInMm) < EPSILON;
  }

  toString(): string {
    const symbol = UNITS[this.unit].symbol;
    return `${this.amount} ${symbol}`;
  }
}
