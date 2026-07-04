/**
 * Console client — the "dowolny (np. konsolowy)" consumer.
 *
 * Runs the full cargo-plan lifecycle against a LIVE TMS API and prints each
 * step. This is the same `CargoPlansClient` used by the Pact consumer test, so
 * the contract we publish matches the calls this client really makes.
 *
 * Usage:
 *   PROVIDER_BASE_URL=http://localhost:3000 npm run demo
 */

import { CargoPlansClient } from './cargo-plans-client';

const BASE_URL = process.env.PROVIDER_BASE_URL ?? 'http://localhost:3000';

async function main(): Promise<void> {
  const client = new CargoPlansClient(BASE_URL);
  console.log(`▶ TMS cargo-plans console client → ${BASE_URL}\n`);

  // 1. Create a new plan
  const planId = await client.createPlan('standard-curtainside');
  console.log(`1. Created load plan: ${planId}`);

  // 2. Add cargo
  await client.addCargo(planId, {
    palletType: 'epal1',
    cargoType: 'GENERAL',
    weightKg: 600,
    cargoHeightMm: 1200,
  });
  console.log('2. Added cargo (EPAL1 / GENERAL / 600kg)');

  const afterAdd = await client.getPlan(planId);
  const unitId = afterAdd.units[0].id;
  console.log(`   → plan now has ${afterAdd.units.length} unit(s); unitId=${unitId}`);

  // 3. Remove cargo
  await client.removeCargo(planId, unitId);
  console.log('3. Removed cargo');

  // 4. Change carrier (plan is empty again → any carrier is valid)
  await client.changeCarrier(planId, 'reefer');
  console.log('4. Changed carrier → reefer');

  // Re-add a unit so the plan can be finalized (must be non-empty).
  await client.addCargo(planId, {
    palletType: 'epal1',
    cargoType: 'GENERAL',
    weightKg: 400,
    cargoHeightMm: 1000,
  });

  // 5. Finalize
  await client.finalize(planId);
  console.log('5. Finalized plan');

  // 6. GET the plan (consumer view — no capabilities / requirements)
  const finalPlan = await client.getPlan(planId);
  console.log('6. GET /cargo-plans/{id} (consumer view):');
  console.log(JSON.stringify(finalPlan, null, 2));

  console.log('\n✅ Flow complete.');
}

main().catch((err) => {
  console.error('❌ Console client failed:', err);
  process.exit(1);
});
