import { PalletUnit } from '../pallets/pallet-unit';
import type { PalletLoadableCarrierSpec } from '../carriers';
import { Length } from '../../shared/length';

/**
 * Domain Service for calculating LDM (loading meters — a 1D measure).
 */
export class LdmCalculator {
  public static calculate(units: PalletUnit[], carrier: PalletLoadableCarrierSpec): Length {
    if (units.length === 0) return Length.zero();

    const sortedUnits = [...units].sort((a, b) =>
      Length.compare(b.getSnapshot().spec.length, a.getSnapshot().spec.length)
    );
    const rows: PalletUnit[][] = [[]];

    for (const unit of sortedUnits) {
      let placed = false;
      for (const row of rows) {
        const rowWidth = row.reduce((sum, u) => sum.add(u.getSnapshot().spec.width), Length.zero());
        if (rowWidth.add(unit.getSnapshot().spec.width).fitsWithin(carrier.width)) {
          row.push(unit);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([unit]);
    }

    const totalLdm = rows.reduce((acc, row) => {
      if (row.length === 0) return acc;
      const [first, ...rest] = row.map(u => u.getSnapshot().spec.length);
      return acc.add(Length.max(first, ...rest));
    }, Length.zero());

    // LDM is conventionally expressed in meters with 2-decimal precision
    return Length.from(Number(totalLdm.valueIn('M').toFixed(2)), 'M');
  }
}
