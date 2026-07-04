/**
 * Pact consumer test — CargoPlanConsole → TmsApi (cargo-plans module).
 *
 * Exercises the full load-plan lifecycle the console client drives:
 *   1. create a plan            POST   /cargo-plans
 *   2. add cargo                POST   /cargo-plans/{id}/cargo
 *   3. remove cargo             DELETE /cargo-plans/{id}/cargo/{unitId}
 *   4. change the carrier       PUT    /cargo-plans/{id}/carrier
 *   5. finalize the plan        POST   /cargo-plans/{id}/finalize
 *   6. read the plan            GET    /cargo-plans/{id}
 *
 * The IDs in steps 2–6 are injected at verification time via
 * `fromProviderState`: each provider state creates the resource on the live
 * API and returns the real id, which Pact substitutes into the request path.
 * That keeps the contract free of hard-coded UUIDs and decoupled from the DB.
 *
 * CDC highlight (step 6): the expected GET body omits the carrier's
 * `capabilities` and each unit's `requirements`. This consumer does not use
 * them, so they are not in the contract. The provider still returns them — and
 * verification passes, because Pact only checks the fields the consumer declares.
 */

import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { CargoPlansClient } from './cargo-plans-client';

const { integer, number, uuid, string, boolean, eachLike, fromProviderState } = MatchersV3;

// Concrete example values used while running against the Pact mock server.
const EXAMPLE_PLAN_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EXAMPLE_UNIT_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const provider = new PactV3({
  consumer: 'CargoPlanConsole',
  provider: 'TmsApi',
  dir: path.resolve(process.cwd(), 'pacts'),
});

async function runTest(): Promise<void> {
  // ── 1. Create a new load plan ────────────────────────────────────────────
  provider
    .given('the provider is ready to create load plans')
    .uponReceiving('a request to create a load plan')
    .withRequest({
      method: 'POST',
      path: '/cargo-plans',
      headers: { 'Content-Type': 'application/json' },
      body: { carrierType: 'standard-curtainside' },
    })
    .willRespondWith({
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: { id: uuid(EXAMPLE_PLAN_ID) },
    });

  // ── 2. Add cargo to the plan ─────────────────────────────────────────────
  provider
    .given('a draft load plan exists', { planId: EXAMPLE_PLAN_ID })
    .uponReceiving('a request to add cargo to the load plan')
    .withRequest({
      method: 'POST',
      path: fromProviderState('/cargo-plans/${planId}/cargo', `/cargo-plans/${EXAMPLE_PLAN_ID}/cargo`),
      headers: { 'Content-Type': 'application/json' },
      body: {
        palletType: 'epal1',
        cargoType: 'GENERAL',
        weightKg: 600,
        cargoHeightMm: 1200,
      },
    })
    .willRespondWith({ status: 204 });

  // ── 3. Remove cargo from the plan ────────────────────────────────────────
  provider
    .given('a draft load plan with a cargo unit exists', { planId: EXAMPLE_PLAN_ID, unitId: EXAMPLE_UNIT_ID })
    .uponReceiving('a request to remove a cargo unit from the load plan')
    .withRequest({
      method: 'DELETE',
      path: fromProviderState(
        '/cargo-plans/${planId}/cargo/${unitId}',
        `/cargo-plans/${EXAMPLE_PLAN_ID}/cargo/${EXAMPLE_UNIT_ID}`,
      ),
    })
    .willRespondWith({ status: 204 });

  // ── 4. Change the carrier type ───────────────────────────────────────────
  provider
    .given('a draft load plan exists', { planId: EXAMPLE_PLAN_ID })
    .uponReceiving('a request to change the carrier type of the load plan')
    .withRequest({
      method: 'PUT',
      path: fromProviderState('/cargo-plans/${planId}/carrier', `/cargo-plans/${EXAMPLE_PLAN_ID}/carrier`),
      headers: { 'Content-Type': 'application/json' },
      body: { carrierType: 'reefer' },
    })
    .willRespondWith({ status: 204 });

  // ── 5. Finalize the plan ─────────────────────────────────────────────────
  provider
    .given('a draft load plan with a cargo unit exists', { planId: EXAMPLE_PLAN_ID, unitId: EXAMPLE_UNIT_ID })
    .uponReceiving('a request to finalize the load plan')
    .withRequest({
      method: 'POST',
      path: fromProviderState('/cargo-plans/${planId}/finalize', `/cargo-plans/${EXAMPLE_PLAN_ID}/finalize`),
    })
    .willRespondWith({ status: 204 });

  // ── 6. Get the plan (CDC: no `capabilities`, no `requirements`) ───────────
  provider
    .given('a load plan with a cargo unit exists', { planId: EXAMPLE_PLAN_ID })
    .uponReceiving('a request for the load plan details')
    .withRequest({
      method: 'GET',
      path: fromProviderState('/cargo-plans/${planId}', `/cargo-plans/${EXAMPLE_PLAN_ID}`),
    })
    .willRespondWith({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: uuid(EXAMPLE_PLAN_ID),
        status: string('DRAFT'),
        version: integer(1),
        weightUnit: string('KG'),
        carrier: {
          // NOTE: `capabilities` intentionally omitted — consumer does not use it.
          type: string('standard-curtainside'),
          vehicleClass: string('MODULAR'),
          requiresTractor: boolean(true),
          canCarryPallets: boolean(true),
          maxWeightCapacityKg: number(24000),
          widthMm: integer(2400),
          heightMm: integer(2700),
          maxLdm: number(13.6),
        },
        currentLdm: number(0.4),
        plannedWeight: number(600),
        units: eachLike({
          // NOTE: `requirements` intentionally omitted — consumer does not use it.
          id: uuid(EXAMPLE_UNIT_ID),
          palletLabel: string('EPAL 1'),
          cargoType: string('GENERAL'),
          weight: number(600),
          totalHeightMm: integer(1400),
        }),
      },
    });

  // ── Drive the real consumer client against the Pact mock server ───────────
  await provider.executeTest(async (mockServer) => {
    const client = new CargoPlansClient(mockServer.url);

    const planId = await client.createPlan('standard-curtainside');
    if (!planId) throw new Error('createPlan returned no id');

    await client.addCargo(EXAMPLE_PLAN_ID, {
      palletType: 'epal1',
      cargoType: 'GENERAL',
      weightKg: 600,
      cargoHeightMm: 1200,
    });

    await client.removeCargo(EXAMPLE_PLAN_ID, EXAMPLE_UNIT_ID);

    await client.changeCarrier(EXAMPLE_PLAN_ID, 'reefer');

    await client.finalize(EXAMPLE_PLAN_ID);

    const plan = await client.getPlan(EXAMPLE_PLAN_ID);
    if (plan.carrier.type !== 'standard-curtainside') {
      throw new Error(`Unexpected carrier type: ${JSON.stringify(plan)}`);
    }
    if (!Array.isArray(plan.units) || plan.units.length === 0) {
      throw new Error(`Expected at least one unit, got: ${JSON.stringify(plan)}`);
    }
    // The consumer only reads these fields — never `capabilities` / `requirements`.
    if (plan.units[0].cargoType !== 'GENERAL') {
      throw new Error(`Unexpected cargoType: ${JSON.stringify(plan.units[0])}`);
    }
  });

  console.log('✅ Consumer contract satisfied — pact written to ./pacts');
}

runTest().catch((err) => {
  console.error('❌ Consumer test failed:', err);
  process.exit(1);
});
