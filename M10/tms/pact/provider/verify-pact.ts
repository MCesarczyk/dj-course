/**
 * Pact provider verification — TmsApi (cargo-plans module).
 *
 * Replays the CargoPlanConsole contract against a running TMS API and, if a
 * broker is configured, publishes the verification result back to it.
 *
 * Provider states seed data through the provider's OWN public API and return
 * the freshly created ids. Pact substitutes those ids into the recorded request
 * paths (see `fromProviderState` in the consumer test), so verification never
 * depends on hard-coded UUIDs or direct database access.
 */

import { execSync } from 'child_process';
import { Verifier } from '@pact-foundation/pact';
import { CargoPlansClient } from '../consumer/cargo-plans-client';

const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL ?? 'http://localhost:3000';
const PACT_BROKER_URL = process.env.PACT_BROKER_URL ?? 'http://localhost:9292';
const USE_BROKER = process.env.PACT_LOCAL !== 'true';

const client = new CargoPlansClient(PROVIDER_BASE_URL);

function providerVersion(): string {
  if (process.env.PROVIDER_VERSION) return process.env.PROVIDER_VERSION;
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return '0.0.0-dev';
  }
}

/** Create an empty DRAFT plan on the live API and return its id. */
async function seedDraftPlan(): Promise<string> {
  return client.createPlan('standard-curtainside');
}

/** Create a DRAFT plan with one cargo unit; return both ids. */
async function seedDraftPlanWithCargo(): Promise<{ planId: string; unitId: string }> {
  const planId = await client.createPlan('standard-curtainside');
  await client.addCargo(planId, {
    palletType: 'epal1',
    cargoType: 'GENERAL',
    weightKg: 600,
    cargoHeightMm: 1200,
  });
  const plan = await client.getPlan(planId);
  const unitId = plan.units[0]?.id;
  if (!unitId) throw new Error('seedDraftPlanWithCargo: no cargo unit was created');
  return { planId, unitId };
}

const opts = {
  provider: 'TmsApi',
  providerBaseUrl: PROVIDER_BASE_URL,
  providerVersion: providerVersion(),

  // Where do the pacts come from?
  ...(USE_BROKER
    ? {
        pactBrokerUrl: PACT_BROKER_URL,
        // Verify the latest pact plus anything on the main branch or deployed to
        // an environment (the union is what a real provider CI would check).
        consumerVersionSelectors: [{ latest: true }, { mainBranch: true }, { deployed: true }],
        publishVerificationResult: true,
      }
    : {
        pactUrls: [require('path').resolve(process.cwd(), 'pacts', 'CargoPlanConsole-TmsApi.json')],
      }),

  stateHandlers: {
    'the provider is ready to create load plans': async () => {
      // Nothing to seed — POST /cargo-plans is self-contained.
      return {};
    },
    'a draft load plan exists': async () => {
      const planId = await seedDraftPlan();
      return { planId };
    },
    'a draft load plan with a cargo unit exists': async () => {
      return seedDraftPlanWithCargo();
    },
    'a load plan with a cargo unit exists': async () => {
      const { planId } = await seedDraftPlanWithCargo();
      return { planId };
    },
  },
};

new Verifier(opts)
  .verifyProvider()
  .then(() => console.log('✅ Provider verification finished'))
  .catch((err) => {
    console.error('❌ Provider verification failed:', err);
    process.exit(1);
  });
