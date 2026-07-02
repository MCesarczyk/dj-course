import { and, count, eq, type SQL } from 'drizzle-orm';
import { db } from '../drizzle/drizzle.js';
import { vehicleModels, type NewVehicleModel } from '../drizzle/schema.js';
import logger from '../logger.js';

export const getVehicleModels = async (params: {
  limit: number;
  offset: number;
  brandId?: number;
  kind?: string;
}) => {
  try {
    const filters: SQL[] = [];
    if (params.brandId !== undefined) filters.push(eq(vehicleModels.brandId, params.brandId));
    if (params.kind !== undefined) filters.push(eq(vehicleModels.kind, params.kind));
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db
      .select({ total: count() })
      .from(vehicleModels)
      .where(where);

    const rows = await db
      .select()
      .from(vehicleModels)
      .where(where)
      .orderBy(vehicleModels.id)
      .limit(params.limit)
      .offset(params.offset);

    return { rows, total };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicle models', { error: err.message });
    throw error;
  }
};

export const getVehicleModelById = async (id: number) => {
  try {
    const result = await db
      .select()
      .from(vehicleModels)
      .where(eq(vehicleModels.id, id));
    return result[0];
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicle model by id', { error: err.message });
    throw error;
  }
};

export const createVehicleModel = async (data: {
  brandId: number;
  name: string;
  kind: string;
  trailerType?: string | null;
}) => {
  try {
    const newModel: NewVehicleModel = {
      brandId: data.brandId,
      name: data.name,
      kind: data.kind,
      trailerType: data.trailerType ?? null,
    };
    const [created] = await db.insert(vehicleModels).values(newModel).returning();
    return created;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error creating vehicle model', { error: err.message });
    throw error;
  }
};

export const updateVehicleModel = async (
  id: number,
  data: {
    brandId?: number;
    name?: string;
    kind?: string;
    trailerType?: string | null;
  }
) => {
  try {
    const [updated] = await db
      .update(vehicleModels)
      .set({
        ...(data.brandId !== undefined && { brandId: data.brandId }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.kind !== undefined && { kind: data.kind }),
        ...(data.trailerType !== undefined && { trailerType: data.trailerType }),
      })
      .where(eq(vehicleModels.id, id))
      .returning();
    return updated;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error updating vehicle model', { error: err.message });
    throw error;
  }
};

export const deleteVehicleModel = async (id: number) => {
  try {
    const result = await db.delete(vehicleModels).where(eq(vehicleModels.id, id));
    return (result.rowCount ?? 0) > 0;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error deleting vehicle model', { error: err.message });
    throw error;
  }
};
