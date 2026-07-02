import { Request, Response } from 'express';
import express from 'express';

import {
  getVehicleBrands,
  getVehicleBrandById,
  createVehicleBrand,
  updateVehicleBrand,
  deleteVehicleBrand,
} from './vehicle-brands.queries';
import {
  vehicleBrandCreateInputSchema,
  vehicleBrandUpdateInputSchema,
} from './vehicle-brands.dto';
import logger from '../logger';
import { parsePositiveInt, parsePathId } from '../shared/query-parsers';
import { pgErrorCode } from '../shared/pg-error';
import { ErrorResponse } from '../types/data-contracts';

const router = express.Router();

const formatZodError = (issues: { message: string }[]) =>
  issues.map((i) => i.message).join(', ');

// Postgres unique-violation error code
const isUniqueViolation = (error: unknown): boolean => pgErrorCode(error) === '23505';

router.get('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;

    const result = await getVehicleBrands({ limit, offset });
    const totalPages = Math.ceil(result.total / limit);

    res.json({
      data: result.rows,
      pagination: { page, limit, total: result.total, totalPages },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicle brands', {
      error: { message: err.message, stack: err.stack },
      operation: 'get_all_vehicle_brands',
    });
    res.status(500).json({ error: 'Failed to fetch vehicle brands' });
  }
});

router.get('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle brand ID must be a positive integer' });
  }
  try {
    const brand = await getVehicleBrandById(id);
    if (!brand) {
      return res.status(404).json({ error: 'Vehicle brand not found' });
    }
    res.json(brand);
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to fetch vehicle brand by id', {
      error: { message: err.message, stack: err.stack },
      vehicle_brand_id: id,
      operation: 'get_vehicle_brand_by_id',
    });
    res.status(500).json({ error: 'Failed to fetch vehicle brand by id' });
  }
});

router.post('/', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const parsed = vehicleBrandCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const brand = await createVehicleBrand(parsed.data);
    logger.info('Vehicle brand created', { vehicle_brand_id: brand.id });
    res.status(201).json(brand);
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: 'Vehicle brand with this name already exists' });
    }
    const err = error as Error;
    logger.error('Failed to create vehicle brand', {
      error: { message: err.message, stack: err.stack },
      operation: 'create_vehicle_brand',
    });
    res.status(500).json({ error: 'Failed to create vehicle brand' });
  }
});

router.put('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle brand ID must be a positive integer' });
  }
  const parsed = vehicleBrandUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    const brand = await updateVehicleBrand(id, parsed.data);
    if (!brand) {
      return res.status(404).json({ error: 'Vehicle brand not found' });
    }
    logger.info('Vehicle brand updated', { vehicle_brand_id: brand.id });
    res.json(brand);
  } catch (error: unknown) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ error: 'Vehicle brand with this name already exists' });
    }
    const err = error as Error;
    logger.error('Failed to update vehicle brand', {
      error: { message: err.message, stack: err.stack },
      vehicle_brand_id: id,
      operation: 'update_vehicle_brand',
    });
    res.status(500).json({ error: 'Failed to update vehicle brand' });
  }
});

router.delete('/:id', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const id = parsePathId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Vehicle brand ID must be a positive integer' });
  }
  try {
    const deleted = await deleteVehicleBrand(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle brand not found' });
    }
    logger.info('Vehicle brand deleted', { vehicle_brand_id: id });
    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Failed to delete vehicle brand', {
      error: { message: err.message, stack: err.stack },
      vehicle_brand_id: id,
      operation: 'delete_vehicle_brand',
    });
    res.status(500).json({ error: 'Failed to delete vehicle brand' });
  }
});

router.all('/', (_req, res) => res.status(405).set('Allow', 'GET, POST').json({ error: 'Method Not Allowed' }));
router.all('/:id', (_req, res) => res.status(405).set('Allow', 'GET, PUT, DELETE').json({ error: 'Method Not Allowed' }));

export default router;
