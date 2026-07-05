import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db } from '../drizzle/drizzle.js';
import { vehicles, type NewVehicle } from '../drizzle/schema.js';
import { pool } from '../database.js';
import logger from '../logger.js';

type VehicleWriteData = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  fuel_tank_capacity?: number | null;
  model_id?: number | null;
  kind?: string | null;
  registration_number?: string | null;
  vin?: string | null;
  first_registration_date?: string | null;
  mileage_km?: number | null;
  status?: string | null;
  specs?: Record<string, unknown> | null;
};

export const getVehicles = async (params: {
  limit: number;
  offset: number;
  kind?: string;
  modelId?: number;
}) => {
  try {
    const filters: SQL[] = [];
    if (params.kind !== undefined) filters.push(eq(vehicles.kind, params.kind));
    if (params.modelId !== undefined) filters.push(eq(vehicles.model_id, params.modelId));
    const where = filters.length ? and(...filters) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(vehicles).where(where);

    const rows = await db
      .select()
      .from(vehicles)
      .where(where)
      .orderBy(desc(vehicles.id)) // newest vehicles (highest id) first
      .limit(params.limit)
      .offset(params.offset);

    return { rows, total };
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicles', { error: err.message });
    throw error;
  }
};

// Detailed view: vehicle instance + catalog (model/brand) + documents + history.
export const getVehicleById = async (id: number) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        v.*,
        row_to_json(m.*)  AS model,
        row_to_json(b.*)  AS brand,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id',              d.id,
            'doc_type',        d.doc_type,
            'document_number', d.document_number,
            'issue_date',      d.issue_date,
            'expiry_date',     d.expiry_date,
            'file_url',        d.file_url,
            'notes',           d.notes
          )) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) AS documents,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id',          h.id,
            'event_type',  h.event_type,
            'event_date',  h.event_date,
            'mileage_km',  h.mileage_km,
            'description', h.description
          )) FILTER (WHERE h.id IS NOT NULL),
          '[]'
        ) AS history
       FROM vehicles v
       LEFT JOIN vehicle_models m ON m.id = v.model_id
       LEFT JOIN vehicle_brands b ON b.id = m.brand_id
       LEFT JOIN vehicle_documents d ON d.vehicle_id = v.id
       LEFT JOIN vehicle_history_events h ON h.vehicle_id = v.id
       WHERE v.id = $1
       GROUP BY v.id, m.id, b.id`,
      [id]
    );
    return rows[0];
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error fetching vehicle by id', { error: err.message });
    throw error;
  }
};

const toInsertValues = (data: VehicleWriteData): Omit<NewVehicle, 'id'> => ({
  make: data.make ?? null,
  model: data.model ?? '',
  year: data.year ?? null,
  fuel_tank_capacity: data.fuel_tank_capacity?.toString() ?? null,
  model_id: data.model_id ?? null,
  kind: data.kind ?? null,
  registration_number: data.registration_number ?? null,
  vin: data.vin ?? null,
  first_registration_date: data.first_registration_date ?? null,
  mileage_km: data.mileage_km ?? null,
  status: data.status ?? undefined,
  specs: data.specs ?? null,
});

export const createVehicle = async (data: VehicleWriteData) => {
  try {
    const [{ nextId }] = await db
      .select({ nextId: sql<number>`COALESCE(MAX(${vehicles.id}), 0) + 1` })
      .from(vehicles);

    const newVehicle: NewVehicle = { id: nextId, ...toInsertValues(data) };

    const [created] = await db.insert(vehicles).values(newVehicle).returning();
    return created;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error creating vehicle', { error: err.message });
    throw error;
  }
};

export const updateVehicle = async (id: number, data: VehicleWriteData) => {
  try {
    const [updated] = await db
      .update(vehicles)
      .set({
        ...(data.make !== undefined && { make: data.make }),
        ...(data.model !== undefined && { model: data.model ?? '' }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.fuel_tank_capacity !== undefined && {
          fuel_tank_capacity: data.fuel_tank_capacity?.toString() ?? null,
        }),
        ...(data.model_id !== undefined && { model_id: data.model_id }),
        ...(data.kind !== undefined && { kind: data.kind }),
        ...(data.registration_number !== undefined && {
          registration_number: data.registration_number,
        }),
        ...(data.vin !== undefined && { vin: data.vin }),
        ...(data.first_registration_date !== undefined && {
          first_registration_date: data.first_registration_date,
        }),
        ...(data.mileage_km !== undefined && { mileage_km: data.mileage_km }),
        ...(data.status !== undefined && data.status !== null && { status: data.status }),
        ...(data.specs !== undefined && { specs: data.specs }),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error updating vehicle', { error: err.message });
    throw error;
  }
};

export const deleteVehicle = async (id: number) => {
  try {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return (result.rowCount ?? 0) > 0;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error deleting vehicle', { error: err.message });
    throw error;
  }
};

export const vehicleExists = async (id: number): Promise<boolean> => {
  const result = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.id, id));
  return result.length > 0;
};
