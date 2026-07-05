import type { PalletLoadableCarrierSpec } from './carrier-spec';
import type { CarrierSpec } from './carrier-spec';
import { Weight } from '../../shared/weight';
import { Length } from '../../shared/length';
import { UnknownCarrierTypeError } from './carrier-factory.errors';

export { UnknownCarrierTypeError } from './carrier-factory.errors';

const REGISTRY: Record<string, () => PalletLoadableCarrierSpec> = {
  // MODULAR — semi-trailers (need a tractor unit)
  'standard-curtainside': () => CarrierFactory.standardCurtainside(),
  'mega': () => CarrierFactory.megaTrailer(),
  'reefer': () => CarrierFactory.refrigerated(),
  // MONOLITHIC — self-contained rigid vehicle bodies (no tractor). Generic categories;
  // concrete brand-models (Fiat Ducato, Renault Master, MAN TGL, …) live in the vehicles catalog.
  'van': () => CarrierFactory.van(),
  'box-truck': () => CarrierFactory.boxTruck(),
};

export class CarrierFactory {
  static fromType(type: string): PalletLoadableCarrierSpec {
    const factory = REGISTRY[type];
    if (!factory) throw new UnknownCarrierTypeError(type, Object.keys(REGISTRY));
    return factory();
  }

  static toTypeKey(carrier: PalletLoadableCarrierSpec): string {
    const entry = Object.entries(REGISTRY).find(([, factory]) => factory().type === carrier.type);
    if (!entry) throw new UnknownCarrierTypeError(carrier.type, Object.keys(REGISTRY));
    return entry[0];
  }

  static allowedTypes(): string[] {
    return Object.keys(REGISTRY);
  }

  // ── MODULAR (semi-trailers) ────────────────────────────────────────────────

  static standardCurtainside(): PalletLoadableCarrierSpec {
    return {
      type: 'Standard Curtainside',
      vehicleClass: 'MODULAR',
      capabilities: { hasClimateControl: false, supportsSideLoading: true, hasHighSecurityLock: false, isBulkReady: false },
      canCarryPallets: true,
      maxWeightCapacity: Weight.from(24000, 'KG'),
      maxLdm: Length.from(13.6, 'M'),
      width: Length.from(2480, 'MM'),
      height: Length.from(2700, 'MM')
    };
  }

  static megaTrailer(): PalletLoadableCarrierSpec {
    return {
      type: 'Mega Trailer',
      vehicleClass: 'MODULAR',
      capabilities: { hasClimateControl: false, supportsSideLoading: true, hasHighSecurityLock: false, isBulkReady: false },
      canCarryPallets: true,
      maxWeightCapacity: Weight.from(24000, 'KG'),
      maxLdm: Length.from(13.6, 'M'),
      width: Length.from(2480, 'MM'),
      height: Length.from(3000, 'MM')
    };
  }

  static refrigerated(): PalletLoadableCarrierSpec {
    return {
      type: 'Reefer',
      vehicleClass: 'MODULAR',
      capabilities: { hasClimateControl: true, supportsSideLoading: false, hasHighSecurityLock: true, isBulkReady: false },
      canCarryPallets: true,
      maxWeightCapacity: Weight.from(22000, 'KG'),
      maxLdm: Length.from(13.4, 'M'),
      width: Length.from(2460, 'MM'),
      height: Length.from(2600, 'MM')
    };
  }

  // ── MONOLITHIC (rigid vehicle bodies) ───────────────────────────────────────
  // Representative generic dimensions (dry freight). A narrow van's "LDM" is a used-floor-
  // length approximation — the metric is standardised for 2.4 m-wide trailers.

  /** Panel van cargo body (e.g. Fiat Ducato / Renault Master class). */
  static van(): PalletLoadableCarrierSpec {
    return {
      type: 'Van',
      vehicleClass: 'MONOLITHIC',
      capabilities: { hasClimateControl: false, supportsSideLoading: false, hasHighSecurityLock: false, isBulkReady: false },
      canCarryPallets: true,
      maxWeightCapacity: Weight.from(1500, 'KG'),
      maxLdm: Length.from(4.07, 'M'),
      width: Length.from(1870, 'MM'),
      height: Length.from(1930, 'MM')
    };
  }

  /** Rigid box truck cargo body (e.g. MAN TGL 12t class). */
  static boxTruck(): PalletLoadableCarrierSpec {
    return {
      type: 'Box Truck',
      vehicleClass: 'MONOLITHIC',
      capabilities: { hasClimateControl: false, supportsSideLoading: false, hasHighSecurityLock: false, isBulkReady: false },
      canCarryPallets: true,
      maxWeightCapacity: Weight.from(5900, 'KG'),
      maxLdm: Length.from(7.2, 'M'),
      width: Length.from(2480, 'MM'),
      height: Length.from(2500, 'MM')
    };
  }

  static tankCarrier(): CarrierSpec {
    return {
      type: 'Tanker',
      vehicleClass: 'MODULAR',
      capabilities: { hasClimateControl: false, supportsSideLoading: false, hasHighSecurityLock: false, isBulkReady: true },
      canCarryPallets: false,
      maxWeightCapacity: Weight.from(25000, 'KG')
    };
  }
}
