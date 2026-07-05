import { Request, Response } from 'express';
import express from 'express';

import logger from '../logger';
import { service } from './fake-dependency-injection';
import { OptimisticLockError } from '../shared/optimistic-lock-error';
import { CargoPlans } from '../types/CargoPlansRoute';
import { ErrorResponse } from '../types/data-contracts';
import { parseCargoType } from './cargo/cargo.types';
import { Weight } from '../shared/weight';
import { Length } from '../shared/length';
import { type CargoPlanServiceError } from './cargo-plans.errors';
import { cargoPlanValidators, sendValidated, validate } from './cargo-plans.validation';

const router = express.Router();

// ── POST / — Create a new load plan ────────────────────────────────────────

router.post('/', async (
  req: Request<
    CargoPlans.CreateLoadPlan.RequestParams,
    CargoPlans.CreateLoadPlan.ResponseBody | ErrorResponse,
    CargoPlans.CreateLoadPlan.RequestBody,
    CargoPlans.CreateLoadPlan.RequestQuery
  >,
  res: Response<CargoPlans.CreateLoadPlan.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.createLoadPlan;

  const headers = validate(v.headers, req.headers);
  if (!headers.success) return res.status(400).json({ error: headers.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const body = validate(v.body, req.body);
  if (!body.success) return res.status(400).json({ error: body.error });

  const result = await service.createLoadPlan({ carrierType: body.data.carrierType });
  if (!result.success) {
    return handleResultError(res, result.error, 'Failed to create load plan');
  }

  logger.info('Load plan created', { plan_id: result.value, carrier_type: body.data.carrierType });
  return sendValidated(res, 201, v.response, { id: result.value }, 'createLoadPlan response');
});

// ── GET /:id — Get load plan details ────────────────────────────────────────

router.get('/:id', async (
  req: Request<
    CargoPlans.GetLoadPlan.RequestParams,
    CargoPlans.GetLoadPlan.ResponseBody | ErrorResponse,
    CargoPlans.GetLoadPlan.RequestBody,
    CargoPlans.GetLoadPlan.RequestQuery
  >,
  res: Response<CargoPlans.GetLoadPlan.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.getLoadPlan;

  const params = validate(v.params, req.params);
  if (!params.success) return res.status(400).json({ error: params.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const weightUnit = Weight.parseUnit(query.data.weightUnit);
  const readModel = await service.findPlan(params.data.id, weightUnit);
  if (!readModel) {
    logger.warn('Failed to fetch load plan', { plan_id: params.data.id });
    return res.status(404).json({ error: `Load plan '${params.data.id}' not found` });
  }
  return sendValidated(res, 200, v.response, readModel, 'getLoadPlan response');
});

// ── POST /:id/cargo — Add cargo to plan ─────────────────────────────────────

router.post('/:id/cargo', async (
  req: Request<
    CargoPlans.AddCargoToLoadPlan.RequestParams,
    CargoPlans.AddCargoToLoadPlan.ResponseBody | ErrorResponse,
    CargoPlans.AddCargoToLoadPlan.RequestBody,
    CargoPlans.AddCargoToLoadPlan.RequestQuery
  >,
  res: Response<CargoPlans.AddCargoToLoadPlan.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.addCargoToLoadPlan;

  const headers = validate(v.headers, req.headers);
  if (!headers.success) return res.status(400).json({ error: headers.error });

  const params = validate(v.params, req.params);
  if (!params.success) return res.status(400).json({ error: params.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const body = validate(v.body, req.body);
  if (!body.success) return res.status(400).json({ error: body.error });

  const cargoType = parseCargoType(body.data.cargoType);
  if (!cargoType) {
    return res.status(400).json({ error: `Unknown cargoType: ${body.data.cargoType}` });
  }
  const result = await service.addCargoToPlan({
    loadPlanId: params.data.id,
    palletType: body.data.palletType,
    cargoType,
    weight: Weight.from(body.data.weightKg, 'KG'),
    cargoHeight: Length.from(body.data.cargoHeightMm, 'MM'),
  });
  if (!result.success) {
    return handleResultError(res, result.error, 'Failed to add cargo to plan');
  }
  logger.info('Cargo added to plan', { plan_id: params.data.id, pallet_type: body.data.palletType });
  return res.status(204).send();
});

// ── DELETE /:id/cargo/:unitId — Remove cargo from plan ──────────────────────

router.delete('/:id/cargo/:unitId', async (
  req: Request<
    CargoPlans.RemoveCargoFromLoadPlan.RequestParams,
    CargoPlans.RemoveCargoFromLoadPlan.ResponseBody | ErrorResponse,
    CargoPlans.RemoveCargoFromLoadPlan.RequestBody,
    CargoPlans.RemoveCargoFromLoadPlan.RequestQuery
  >,
  res: Response<CargoPlans.RemoveCargoFromLoadPlan.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.removeCargoFromLoadPlan;

  const params = validate(v.params, req.params);
  if (!params.success) return res.status(400).json({ error: params.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const result = await service.removeCargoFromPlan({
    loadPlanId: params.data.id,
    unitId: params.data.unitId,
  });
  if (!result.success) {
    return handleResultError(res, result.error, 'Failed to remove cargo from plan');
  }
  logger.info('Cargo removed from plan', { plan_id: params.data.id, unit_id: params.data.unitId });
  return res.status(204).send();
});

// ── PUT /:id/carrier — Change carrier type ──────────────────────────────────

router.put('/:id/carrier', async (
  req: Request<
    CargoPlans.ChangeCarrierType.RequestParams,
    CargoPlans.ChangeCarrierType.ResponseBody | ErrorResponse,
    CargoPlans.ChangeCarrierType.RequestBody,
    CargoPlans.ChangeCarrierType.RequestQuery
  >,
  res: Response<CargoPlans.ChangeCarrierType.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.changeCarrierType;

  const headers = validate(v.headers, req.headers);
  if (!headers.success) return res.status(400).json({ error: headers.error });

  const params = validate(v.params, req.params);
  if (!params.success) return res.status(400).json({ error: params.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const body = validate(v.body, req.body);
  if (!body.success) return res.status(400).json({ error: body.error });

  const result = await service.changeCarrierType({
    loadPlanId: params.data.id,
    carrierType: body.data.carrierType,
  });
  if (!result.success) {
    return handleResultError(res, result.error, 'Failed to change carrier type');
  }
  logger.info('Carrier type changed', { plan_id: params.data.id, carrier_type: body.data.carrierType });
  return res.status(204).send();
});

// ── POST /:id/finalize — Finalize the plan ──────────────────────────────────

router.post('/:id/finalize', async (
  req: Request<
    CargoPlans.FinalizeLoadPlan.RequestParams,
    CargoPlans.FinalizeLoadPlan.ResponseBody | ErrorResponse,
    CargoPlans.FinalizeLoadPlan.RequestBody,
    CargoPlans.FinalizeLoadPlan.RequestQuery
  >,
  res: Response<CargoPlans.FinalizeLoadPlan.ResponseBody | ErrorResponse>,
) => {
  const v = cargoPlanValidators.finalizeLoadPlan;

  const params = validate(v.params, req.params);
  if (!params.success) return res.status(400).json({ error: params.error });

  const query = validate(v.query, req.query);
  if (!query.success) return res.status(400).json({ error: query.error });

  const result = await service.finalizeLoadPlan(params.data.id);
  if (!result.success) {
    return handleResultError(res, result.error, 'Failed to finalize load plan');
  }
  logger.info('Load plan finalized', { plan_id: params.data.id });
  return res.status(204).send();
});

// ── Error handling ──────────────────────────────────────────────────────────

function handleResultError(
  res: Response,
  err: CargoPlanServiceError,
  context: string
): Response<ErrorResponse> {
  if (err instanceof OptimisticLockError) {
    logger.warn(context, { error: err.message });
    return res.status(409).json({ error: err.message });
  }
  switch (err.kind) {
    case 'LoadPlanNotFoundError':
      logger.warn(context, { error: err.message });
      return res.status(404).json({ error: err.message });
    case 'PlanAlreadyFinalizedError':
      logger.warn(context, { error: err.message });
      return res.status(409).json({ error: err.message });
    case 'EmptyPlanError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'WeightCapacityExceededError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'LdmCapacityExceededError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'CargoTooTallForCarrierError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'CarrierCapabilityMismatchError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'IncompatibleCargoColoadingError':
      logger.warn(context, { error: err.message });
      return res.status(409).json({ error: err.message });
    case 'CargoUnitNotFoundError':
      logger.warn(context, { error: err.message });
      return res.status(404).json({ error: err.message });
    case 'PalletWeightExceedsCapacityError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
    case 'PalletCargoTypeNotAllowedError':
      logger.warn(context, { error: err.message });
      return res.status(422).json({ error: err.message });
  }
}

export default router;
