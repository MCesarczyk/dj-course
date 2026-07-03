# PACT Contract Testing – TMS `cargo-plans`

Consumer-Driven Contract (CDC) tests for the TMS API **cargo-plans** module,
using [Pact](https://pact.io) with a local Pact Broker and a `can-i-deploy` gate.

- **Consumer:** `CargoPlanConsole` — a console client that drives the full
  load-plan lifecycle.
- **Provider:** `TmsApi` — the running TMS API (`localhost:3000`).

## The flow under contract

The console client (`consumer/cargo-plans-client.ts`) exercises the whole
lifecycle, and the same client is used to generate the contract:

| # | Step            | Request                                        | Status |
|---|-----------------|------------------------------------------------|--------|
| 1 | Create a plan   | `POST /cargo-plans`                            | 201    |
| 2 | Add cargo       | `POST /cargo-plans/{id}/cargo`                 | 204    |
| 3 | Remove cargo    | `DELETE /cargo-plans/{id}/cargo/{unitId}`      | 204    |
| 4 | Change trailer  | `PUT /cargo-plans/{id}/trailer`                | 204    |
| 5 | Finalize plan   | `POST /cargo-plans/{id}/finalize`              | 204    |
| 6 | Read the plan   | `GET /cargo-plans/{id}`                        | 200    |

## The CDC point 🎯

In interaction **#6** the expected `GET /cargo-plans/{id}` body deliberately
**omits** two things the console client never reads:

- `trailer.capabilities`
- `units[].requirements`

The provider still returns them — verification passes anyway, because Pact only
checks the fields the **consumer** declares it needs. That's consumer-driven
contracts: the consumer's needs shape the contract, not the provider's full
response. See `consumer/cargo-plans-client.ts` (`CargoPlanView`) and the
`NOTE:` comments in `consumer/pact-test.ts`.

## Provider states (no hard-coded IDs)

Steps 2–6 need a plan (and, for removal, a unit) to already exist. The request
paths use `MatchersV3.fromProviderState('/cargo-plans/${planId}', ...)`. During
verification each `stateHandlers` callback in `provider/verify-pact.ts` creates
the resource through the provider's **own public API** and returns the real
ids, which Pact substitutes into the recorded paths. No fixed UUIDs, no direct
DB access.

## Layout

```
pact/
├── consumer/
│   ├── cargo-plans-client.ts   # reusable HTTP client (CargoPlanView omits capabilities/requirements)
│   ├── pact-test.ts            # consumer contract test → writes pacts/CargoPlanConsole-TmsApi.json
│   └── console-demo.ts         # runs the full flow against a LIVE API
├── provider/
│   └── verify-pact.ts          # provider verification + provider-state seeding
└── pacts/                      # generated contracts (gitignored)
```

## Prerequisites

Node.js 18+ and the TMS stack (Postgres, TMS API, Pact Broker) from the TMS
`docker-compose.yml`:

```bash
# from M10/tms
docker compose up -d tms-postgres pact-postgres pact-broker tms-api
```

- TMS API:     http://localhost:3000
- Pact Broker: http://localhost:9292

Install the Pact tooling once: `npm install` (from `pact/`).

## End-to-end run

```bash
# 0. (optional) sanity-check the client against the live API
PROVIDER_BASE_URL=http://localhost:3000 npm run demo

# 1. Consumer: generate the contract (uses the Pact mock server, no live API)
npm run test:consumer

# 2. Publish the contract to the broker
npm run pact:publish

# 3. Provider: verify the contract against the live API, publish results
PROVIDER_BASE_URL=http://localhost:3000 npm run test:provider

# 4. Record what's live, then ask the broker if a deploy is safe
npm run record-deployment:provider     # TmsApi is in production
npm run can-i-deploy:consumer           # → "Computer says yes \o/"
```

Versions are the current git short SHA; the broker branch is the current git
branch. Override the broker with `PACT_BROKER_URL`.

### Verify from a local file (no broker)

```bash
npm run test:provider:local             # reads pacts/CargoPlanConsole-TmsApi.json
```

## `can-i-deploy` — the safety gate

`can-i-deploy` blocks a deploy unless there is a **verified** pact between the
version you want to ship and the versions of the other side currently in the
target environment:

```bash
npm run can-i-deploy:consumer   # can CargoPlanConsole go to production?
npm run can-i-deploy:provider   # can TmsApi go to production?
```

If the provider has not been verified/recorded in `production` yet, you'll get
`Computer says no ¯\_(ツ)_/¯` and a non-zero exit — exactly the guard that keeps
an incompatible consumer out of production.
