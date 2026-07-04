import { Weight } from '../../shared/weight';

/**
 * Shape of the load carrier.
 *   - MONOLITHIC: a single self-contained vehicle body (van / rigid box truck). One asset.
 *   - MODULAR:    a semi-trailer — the towed half of a tractor+trailer rig. Moving it needs a
 *                 separate tractor unit (two assets total).
 *
 * This module only plans the *load* (does the freight fit?). Which/how many vehicles get
 * reserved to pull the cargo is a fleet/dispatch concern, not a load-fitting one. The flag is
 * metadata: it lets downstream dispatch know a MODULAR plan implies a tractor, without this
 * context reserving one. The concrete brand-models (Fiat Ducato, MAN TGL, …) live in the
 * vehicles catalog; here we only model generic loadable-space categories.
 */
export type VehicleClass = 'MONOLITHIC' | 'MODULAR';

/** Defines specific functional features of a load carrier. */
export interface CarrierCapabilities {
  /** Indicates presence of temperature regulation systems. Example cargo: Frozen meat. */
  readonly hasClimateControl: boolean;
  /** Confirms if cargo can be loaded from the side. Example cargo: Long timber. */
  readonly supportsSideLoading: boolean;
  /** Specifies reinforced locking mechanisms for high-value goods. Example cargo: Electronics. */
  readonly hasHighSecurityLock: boolean;
  /** Determines suitability for transporting loose bulk materials. Example cargo: Grain. */
  readonly isBulkReady: boolean;
}

/** General physical and functional description of a load carrier. */
export interface CarrierSpec {
  /** Categorization of the carrier body/chassis style. Example: "Reefer". */
  readonly type: string;
  /** Whether the carrier is a single vehicle (MONOLITHIC) or a towed trailer (MODULAR). */
  readonly vehicleClass: VehicleClass;
  /** Embedded set of specific operational capabilities and features. */
  readonly capabilities: CarrierCapabilities;
  /** Boolean flag for standard palletized cargo compatibility. Example: True. */
  readonly canCarryPallets: boolean;
  /** Absolute limit of cargo mass the carrier supports. Example: 24000kg. */
  readonly maxWeightCapacity: Weight;
}

/** Specialized specification for carriers designed for pallet transport. */
export type PalletLoadableCarrierSpec = CarrierSpec & {
  /** Explicit requirement for pallet loading capability. Example: True. */
  readonly canCarryPallets: true;
  /** Internal horizontal span of the loading space in millimeters. Example: 2450. */
  readonly widthMm: number;
  /** Internal vertical clearance of the loading space in millimeters. Example: 2700. */
  readonly heightMm: number;
  /** Maximum loading meters available for cargo placement. Example: 13.6 (typical for TIR 😎). */
  readonly maxLdm: number;
};

export function isPalletLoadable(spec: CarrierSpec): spec is PalletLoadableCarrierSpec {
  return spec.canCarryPallets === true && 'widthMm' in spec && 'maxLdm' in spec;
}

/** A MODULAR carrier (semi-trailer) needs a separate tractor unit to be moved. */
export function requiresTractor(spec: CarrierSpec): boolean {
  return spec.vehicleClass === 'MODULAR';
}
