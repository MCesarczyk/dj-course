/**
 * Reusable TMS cargo-plans client.
 *
 * This is the *consumer* code: a plain HTTP client for the cargo-plans module of
 * the TMS API. It is shared by two callers:
 *   - the Pact consumer test (`pact-test.ts`), which runs it against the Pact
 *     mock server to generate the contract, and
 *   - the console demo (`console-demo.ts`), which runs it against the live API.
 *
 * CDC note: `CargoPlanView` intentionally omits the carrier's `capabilities`
 * and each unit's `requirements`. This consumer simply does not use those
 * fields, so they are absent from the type — and, consequently, from the
 * contract we publish. The provider may keep returning them; Pact only verifies
 * the fields the consumer actually declares it needs.
 */

export type CarrierType = 'standard-curtainside' | 'mega' | 'reefer' | 'van' | 'box-truck';
export type VehicleClass = 'MONOLITHIC' | 'MODULAR';
export type PalletType = 'epal1' | 'industrial' | 'half' | 'cp1' | 'cp3' | 'h1';
export type CargoType = 'FOOD' | 'CHEMICAL' | 'ELECTRONICS' | 'ADR' | 'GENERAL';
export type WeightUnit = 'KG' | 'TONNE' | 'LB';
export type CargoLoadPlanStatus = 'DRAFT' | 'FINALIZED';

export interface AddCargoInput {
  palletType: PalletType;
  cargoType: CargoType;
  weightKg: number;
  cargoHeightMm: number;
}

/** Carrier info as the consumer needs it — WITHOUT `capabilities`. */
export interface CarrierView {
  type: CarrierType;
  vehicleClass: VehicleClass;
  requiresTractor: boolean;
  canCarryPallets: boolean;
  maxWeightCapacityKg: number;
  widthMm: number;
  heightMm: number;
  maxLdm: number;
  /** BREAKING (v2): new field this consumer now requires. */
  axleCount: number;
}

/** Cargo unit as the consumer needs it — WITHOUT `requirements`. */
export interface PalletUnitView {
  id: string;
  palletLabel: string;
  cargoType: CargoType;
  /** BREAKING (v2): renamed from `weight`. */
  weightKg: number;
  totalHeightMm: number;
}

/** The subset of GET /cargo-plans/{id} this consumer depends on. */
export interface CargoPlanView {
  id: string;
  status: CargoLoadPlanStatus;
  version: number;
  weightUnit: WeightUnit;
  carrier: CarrierView;
  currentLdm: number;
  /** BREAKING (v2): renamed from `plannedWeight`. */
  plannedWeightKg: number;
  units: PalletUnitView[];
}

export class CargoPlanApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
    body: string,
  ) {
    super(`${method} ${path} → ${status}: ${body}`);
    this.name = 'CargoPlanApiError';
  }
}

export class CargoPlansClient {
  constructor(private readonly baseUrl: string) {}

  /** POST /cargo-plans — create a new draft plan. */
  async createPlan(carrierType: CarrierType): Promise<string> {
    const { id } = await this.request<{ id: string }>('POST', '/cargo-plans', { carrierType });
    return id;
  }

  /** POST /cargo-plans/{id}/cargo — add a cargo unit (204, no body). */
  async addCargo(planId: string, input: AddCargoInput): Promise<void> {
    await this.request<void>('POST', `/cargo-plans/${planId}/cargo`, input);
  }

  /** DELETE /cargo-plans/{id}/cargo/{unitId} — remove a cargo unit (204). */
  async removeCargo(planId: string, unitId: string): Promise<void> {
    await this.request<void>('DELETE', `/cargo-plans/${planId}/cargo/${unitId}`);
  }

  /** PUT /cargo-plans/{id}/carrier — swap the carrier type (204). */
  async changeCarrier(planId: string, carrierType: CarrierType): Promise<void> {
    await this.request<void>('PUT', `/cargo-plans/${planId}/carrier`, { carrierType });
  }

  /** POST /cargo-plans/{id}/finalize — finalize the plan (204). */
  async finalize(planId: string): Promise<void> {
    await this.request<void>('POST', `/cargo-plans/${planId}/finalize`);
  }

  /** GET /cargo-plans/{id} — read the plan (only the fields we care about). */
  async getPlan(planId: string): Promise<CargoPlanView> {
    return this.request<CargoPlanView>('GET', `/cargo-plans/${planId}`);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      throw new CargoPlanApiError(res.status, method, path, await res.text());
    }

    // 204 No Content (add/remove/change/finalize) — nothing to parse.
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return (await res.json()) as T;
  }
}
