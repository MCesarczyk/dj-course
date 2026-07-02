import { Request, Response } from 'express';
import express from 'express';

import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from './vehicles.queries';
import {
  vehicleCreateInputSchema,
  vehicleUpdateInputSchema,
  vehicleKindSchema,
} from './vehicles.dto';
import subresourcesRouter from './vehicle-subresources.routes';
import logger from '../logger';
import { parsePositiveInt, parsePathId, parseOptionalQueryString } from '../shared/query-parsers';
import { pgErrorCode as pgCode } from '../shared/pg-error';
import { ErrorResponse } from '../types/data-contracts';

const router = express.Router();

const formatZodError = (issues: { message: string }[]) =>
  issues.map((i) => i.message).join(', ');

router.get('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const kindRaw = parseOptionalQueryString(req.query.kind);
    if (kindRaw !== undefined && !vehicleKindSchema.safeParse(kindRaw).success) {
      return res.status(400).json({ error: 'kind must be TRACTOR_UNIT or SEMI_TRAILER' });
    }

    const modelIdRaw = parseOptionalQueryString(req.query.modelId);
    const modelId = modelIdRaw !== undefined ? parsePositiveInt(modelIdRaw, 0) : undefined;
    if (modelIdRaw !== undefined && !modelId) {
      return res.status(400).json({ error: 'modelId must be a positive integer' });
    }

    const result = await getVehicles({ limit, offset, kind: kindRaw, modelId });
    const totalPages = Math.ceil(result.total / limit);

    logger.info('Retrieved vehicles', {
      vehicle_count: result.rows.length,
      operation: 'get_all_vehicles',
    });
    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.total, totalPages },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicles', {
      error: { message: err.message, stack: err.stack },
      operation: 'get_all_vehicles',
    });
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle ID must be a positive integer' });
  }
  try {
    const vehicle = await getVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    logger.info('Retrieved vehicle', { vehicle_id: vehicle.id, operation: 'get_vehicle_by_id' });
    res.json(vehicle);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicle by id', {
      error: { message: err.message, stack: err.stack },
      vehicle_id: id,
      operation: 'get_vehicle_by_id',
    });
    res.status(500).json({ error: 'Failed to fetch vehicle by id' });
  }
});

router.post('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const parsed = vehicleCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const vehicle = await createVehicle(parsed.data);
    logger.info('Vehicle created', { vehicle_id: vehicle.id });
    res.status(201).json(vehicle);
  } catch (error: unknown) {
    if (pgCode(error) === '23503') {
      return res.status(400).json({ error: 'Referenced vehicle model does not exist' });
    }
    const err = error as Error;
    logger.error('Failed to create vehicle', {
      error: { message: err.message, stack: err.stack },
      operation: 'create_vehicle',
    });
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

router.put('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle ID must be a positive integer' });
  }
  const parsed = vehicleUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const vehicle = await updateVehicle(id, parsed.data);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or invalid data' });
    }
    logger.info('Vehicle updated', { vehicle_id: vehicle.id });
    res.json(vehicle);
  } catch (error: unknown) {
    if (pgCode(error) === '23503') {
      return res.status(400).json({ error: 'Referenced vehicle model does not exist' });
    }
    const err = error as Error;
    logger.error('Failed to update vehicle', {
      error: { message: err.message, stack: err.stack },
      vehicle_id: id,
      operation: 'update_vehicle',
    });
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

router.delete('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle ID must be a positive integer' });
  }
  try {
    const deleted = await deleteVehicle(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    logger.info('Vehicle deleted', { vehicle_id: id });
    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to delete vehicle', {
      error: { message: err.message, stack: err.stack },
      vehicle_id: id,
      operation: 'delete_vehicle',
    });
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Nested sub-resources: /vehicles/:id/documents, /vehicles/:id/history
router.use('/:id', subresourcesRouter);

router.all('/', (_req, res) => res.status(405).set('Allow', 'GET, POST').json({ error: 'Method Not Allowed' }));
router.all('/:id', (_req, res) => res.status(405).set('Allow', 'GET, PUT, DELETE').json({ error: 'Method Not Allowed' }));

export default router;
