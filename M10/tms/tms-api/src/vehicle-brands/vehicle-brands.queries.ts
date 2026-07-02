import { count, eq } from 'drizzle-orm';
import { db } from '../drizzle/drizzle.js';
import { vehicleBrands, type NewVehicleBrand } from '../drizzle/schema.js';
import logger from '../logger.js';

export const getVehicleBrands = async (params: {
  limit: number;
  offset: number;
}) => {
  try {
    const [{ total }] = await db.select({ total: count() }).from(vehicleBrands);

    const rows = await db
      .select()
      .from(vehicleBrands)
      .orderBy(vehicleBrands.id)
      .limit(params.limit)
      .offset(params.offset);

    return { rows, total };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicle brands', { error: err.message });
    throw error;
  }
};

export const getVehicleBrandById = async (id: number) => {
  try {
    const result = await db
      .select()
      .from(vehicleBrands)
      .where(eq(vehicleBrands.id, id));
    return result[0];
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicle brand by id', { error: err.message });
    throw error;
  }
};

export const createVehicleBrand = async (data: {
  name: string;
  country?: string | null;
}) => {
  try {
    const newBrand: NewVehicleBrand = {
      name: data.name,
      country: data.country ?? null,
    };
    const [created] = await db.insert(vehicleBrands).values(newBrand).returning();
    return created;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error creating vehicle brand', { error: err.message });
    throw error;
  }
};

export const updateVehicleBrand = async (
  id: number,
  data: { name?: string; country?: string | null }
) => {
  try {
    const [updated] = await db
      .update(vehicleBrands)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.country !== undefined && { country: data.country }),
      })
      .where(eq(vehicleBrands.id, id))
      .returning();
    return updated;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error updating vehicle brand', { error: err.message });
    throw error;
  }
};

export const deleteVehicleBrand = async (id: number) => {
  try {
    const result = await db.delete(vehicleBrands).where(eq(vehicleBrands.id, id));
    return (result.rowCount ?? 0) > 0;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error deleting vehicle brand', { error: err.message });
    throw error;
  }
};
