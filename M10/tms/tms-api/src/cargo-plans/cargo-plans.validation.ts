/**
 * Runtime type checks for the cargo-plans HTTP endpoints.
 *
 * All schemas are sourced from the ready-made zod contract
 * (`contract/contract-types-openapi-zod-client`, symlinked as `../zod`), which is
 * generated from the same OpenAPI document as the route/response TypeScript types.
 * This module wires those schemas to each endpoint so that every request part
 * (headers, URL params, query string, payload) and every response body is
 * validated against the contract at runtime.
 */
import { z } from 'zod';
import { Response } from 'express';

import logger from '../logger';
import { schemas, endpointParams, queryParams } from '../zod/contract';

// ── Result of a single validation step ──────────────────────────────────────

export type Validated<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Flattens zod issues into a single human-readable message. */
const formatZodError = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');

/** Validates an arbitrary value against a schema, normalising the outcome. */
export const validate = <T>(schema: z.ZodType<T>, value: unknown): Validated<T> => {
  const result = schema.safeParse(value);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: formatZodError(result.error) };
};

/**
 * Validates an outgoing response body against its contract schema and sends it.
 * A mismatch here means the server produced a payload that violates the contract,
 * so it is logged and surfaced as a 500 rather than shipping bad data to clients.
 */
export const sendValidated = <T>(
  res: Response,
  status: number,
  schema: z.ZodType<T>,
  body: unknown,
  context: string,
): Response => {
  const result = schema.safeParse(body);
  if (!result.success) {
    logger.error('Response contract violation', {
      context,
      error: formatZodError(result.error),
    });
    return res.status(500).json({ error: 'Internal response validation error' });
  }
  return res.status(status).json(result.data);
};

// ── Header schemas ──────────────────────────────────────────────────────────
// The contract defines no custom headers, but endpoints that carry a JSON body
// must announce it via Content-Type, otherwise the body parser yields no payload.

export const jsonRequestHeaders = z
  .object({
    'content-type': z
      .string({ error: 'Content-Type header is required' })
      .refine((value) => value.toLowerCase().includes('application/json'), {
        message: "Content-Type must be 'application/json'",
      }),
  })
  .passthrough();

// ── Per-endpoint validators ─────────────────────────────────────────────────
// `params`/`query` wrap the contract's field-level schemas into object schemas
// matching the Express `req.params` / `req.query` shape.

export const cargoPlanValidators = {
  createLoadPlan: {
    headers: jsonRequestHeaders,
    query: queryParams.createLoadPlan,
    body: endpointParams.createLoadPlan.body,
    response: schemas.CreateLoadPlanResponse,
  },
  getLoadPlan: {
    params: z.object({ id: endpointParams.getLoadPlan.id }),
    query: queryParams.getLoadPlan,
    response: schemas.CargoLoadPlanReadModel,
  },
  addCargoToLoadPlan: {
    headers: jsonRequestHeaders,
    params: z.object({ id: endpointParams.addCargoToLoadPlan.id }),
    query: queryParams.addCargoToLoadPlan,
    body: endpointParams.addCargoToLoadPlan.body,
  },
  removeCargoFromLoadPlan: {
    params: z.object({
      id: endpointParams.removeCargoFromLoadPlan.id,
      unitId: endpointParams.removeCargoFromLoadPlan.unitId,
    }),
    query: queryParams.removeCargoFromLoadPlan,
  },
  changeCarrierType: {
    headers: jsonRequestHeaders,
    params: z.object({ id: endpointParams.changeCarrierType.id }),
    query: queryParams.changeCarrierType,
    body: endpointParams.changeCarrierType.body,
  },
  finalizeLoadPlan: {
    params: z.object({ id: endpointParams.finalizeLoadPlan.id }),
    query: queryParams.finalizeLoadPlan,
  },
} as const;
