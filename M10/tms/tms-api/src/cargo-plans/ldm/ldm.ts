import { Length } from '../../shared/length';

/**
 * Loading meters (Value Object).
 *
 * LDM is NOT a geometric length: it is a measure of consumed trailer floor
 * capacity, standardised for 2.4 m-wide trailers and expressed in meters with
 * 2-decimal precision. You cannot measure "ldm" on any physical object with
 * a ruler — it is always derived (here: by the row-packing LdmCalculator).
 *
 * A dedicated type (instead of reusing Length) makes category errors
 * uncompilable: comparing a pallet's length against maxLdm, adding LDM to
 * a height, or expressing LDM in millimeters. The ONLY bridge from geometry
 * to capacity is `fromFloorLength`, so every LDM value provably went through
 * a floor-length calculation.
 */
export class Ldm {
  private constructor(private readonly meters: number) {}

  static of(meters: number): Ldm {
    if (!Number.isFinite(meters)) throw new Error('LDM must be a finite number');
    if (meters < 0) throw new Error('LDM cannot be negative');
    // LDM convention: meters with 2-decimal precision — a rule of the concept, not of length
    return new Ldm(Number(meters.toFixed(2)));
  }

  static zero(): Ldm {
    return new Ldm(0);
  }

  /** The single conversion point from geometric floor length to consumed capacity. */
  static fromFloorLength(floorLength: Length): Ldm {
    return Ldm.of(floorLength.valueIn('M'));
  }

  get valueInMeters(): number {
    return this.meters;
  }

  isGreaterThan(other: Ldm): boolean {
    return this.meters > other.meters;
  }

  equals(other: Ldm): boolean {
    // Using an epsilon to handle floating point precision issues across systems
    const EPSILON = 0.0000001;
    return Math.abs(this.meters - other.meters) < EPSILON;
  }

  toString(): string {
    return `${this.meters} ldm`;
  }
}
