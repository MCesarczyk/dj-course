import { Request, Response } from 'express';
import express from 'express';

import {
  getVehicleModels,
  getVehicleModelById,
  createVehicleModel,
  updateVehicleModel,
  deleteVehicleModel,
} from './vehicle-models.queries';
import {
  vehicleModelCreateInputSchema,
  vehicleModelUpdateInputSchema,
  vehicleKindSchema,
} from './vehicle-models.dto';
import logger from '../logger';
import { parsePositiveInt, parsePathId, parseOptionalQueryString } from '../shared/query-parsers';
import { pgErrorCode as pgCode } from '../shared/pg-error';
import { ErrorResponse } from '../types/data-contracts';

const router = express.Router();

const formatZodError = (issues: { message: string }[]) =>
  issues.map((i) => i.message).join(', ');

// Map a Postgres integrity error to an HTTP response; returns true if handled.
const handleIntegrityError = (error: unknown, res: Response): boolean => {
  const code = pgCode(error);
  if (code === '23505') {
    res.status(409).json({ error: 'A model with this name already exists for the brand' });
    return true;
  }
  if (code === '23503') {
    res.status(400).json({ error: 'Referenced vehicle brand does not exist' });
    return true;
  }
  if (code === '23514') {
    res.status(400).json({ error: 'Invalid kind / trailerType combination' });
    return true;
  }
  return false;
};

router.get('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const brandIdRaw = parseOptionalQueryString(req.query.brandId);
    const brandId = brandIdRaw !== undefined ? parsePositiveInt(brandIdRaw, 0) : undefined;
    if (brandIdRaw !== undefined && !brandId) {
      return res.status(400).json({ error: 'brandId must be a positive integer' });
    }

    const kindRaw = parseOptionalQueryString(req.query.kind);
    if (kindRaw !== undefined && !vehicleKindSchema.safeParse(kindRaw).success) {
      return res.status(400).json({ error: 'kind must be one of: TRACTOR_UNIT, SEMI_TRAILER, VAN, BOX_TRUCK' });
    }

    const result = await getVehicleModels({ limit, offset, brandId, kind: kindRaw });
    const totalPages = Math.ceil(result.total / limit);

    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.total, totalPages },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicle models', {
      error: { message: err.message, stack: err.stack },
      operation: 'get_all_vehicle_models',
    });
    res.status(500).json({ error: 'Failed to fetch vehicle models' });
  }
});

router.get('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle model ID must be a positive integer' });
  }
  try {
    const model = await getVehicleModelById(id);
    if (!model) {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    res.json(model);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicle model by id', {
      error: { message: err.message, stack: err.stack },
      vehicle_model_id: id,
      operation: 'get_vehicle_model_by_id',
    });
    res.status(500).json({ error: 'Failed to fetch vehicle model by id' });
  }
});

router.post('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const parsed = vehicleModelCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const model = await createVehicleModel(parsed.data);
    logger.info('Vehicle model created', { vehicle_model_id: model.id });
    res.status(201).json(model);
  } catch (error: unknown) {
    if (handleIntegrityError(error, res)) return;
    const err = error as Error;
    logger.error('Failed to create vehicle model', {
      error: { message: err.message, stack: err.stack },
      operation: 'create_vehicle_model',
    });
    res.status(500).json({ error: 'Failed to create vehicle model' });
  }
});

router.put('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle model ID must be a positive integer' });
  }
  const parsed = vehicleModelUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const model = await updateVehicleModel(id, parsed.data);
    if (!model) {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    logger.info('Vehicle model updated', { vehicle_model_id: model.id });
    res.json(model);
  } catch (error: unknown) {
    if (handleIntegrityError(error, res)) return;
    const err = error as Error;
    logger.error('Failed to update vehicle model', {
      error: { message: err.message, stack: err.stack },
      vehicle_model_id: id,
      operation: 'update_vehicle_model',
    });
    res.status(500).json({ error: 'Failed to update vehicle model' });
  }
});

router.delete('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle model ID must be a positive integer' });
  }
  try {
    const deleted = await deleteVehicleModel(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    logger.info('Vehicle model deleted', { vehicle_model_id: id });
    res.status(204).send();
  } catch (error: unknown) {
    if (pgCode(error) === '23503') {
      return res.status(409).json({ error: 'Cannot delete model referenced by existing vehicles' });
    }
    const err = error as Error;
    logger.error('Failed to delete vehicle model', {
      error: { message: err.message, stack: err.stack },
      vehicle_model_id: id,
      operation: 'delete_vehicle_model',
    });
    res.status(500).json({ error: 'Failed to delete vehicle model' });
  }
});

router.all('/', (_req, res) => res.status(405).set('Allow', 'GET, POST').json({ error: 'Method Not Allowed' }));
router.all('/:id', (_req, res) => res.status(405).set('Allow', 'GET, PUT, DELETE').json({ error: 'Method Not Allowed' }));

export default router;
