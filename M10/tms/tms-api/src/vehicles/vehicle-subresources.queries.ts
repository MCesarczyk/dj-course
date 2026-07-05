import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../drizzle/drizzle.js';
import {
  vehicleDocuments,
  vehicleHistoryEvents,
  type NewVehicleDocument,
  type NewVehicleHistoryEvent,
} from '../drizzle/schema.js';
import logger from '../logger.js';

// ─── documents ───────────────────────────────────────────────────────────────

export const getVehicleDocuments = async (vehicleId: number) => {
  try {
    return await db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.vehicleId, vehicleId))
      .orderBy(asc(vehicleDocuments.expiryDate));
  } catch (error: unknown) {
    logger.error('Error fetching vehicle documents', { error: (error as Error).message });
    throw error;
  }
};

export const createVehicleDocument = async (data: NewVehicleDocument) => {
  try {
    const [created] = await db.insert(vehicleDocuments).values(data).returning();
    return created;
  } catch (error: unknown) {
    logger.error('Error creating vehicle document', { error: (error as Error).message });
    throw error;
  }
};

export const deleteVehicleDocument = async (vehicleId: number, docId: number) => {
  try {
    const result = await db
      .delete(vehicleDocuments)
      .where(and(eq(vehicleDocuments.id, docId), eq(vehicleDocuments.vehicleId, vehicleId)));
    return (result.rowCount ?? 0) > 0;
  } catch (error: unknown) {
    logger.error('Error deleting vehicle document', { error: (error as Error).message });
    throw error;
  }
};

// ─── history ─────────────────────────────────────────────────────────────────

export const getVehicleHistory = async (vehicleId: number) => {
  try {
    return await db
      .select()
      .from(vehicleHistoryEvents)
      .where(eq(vehicleHistoryEvents.vehicleId, vehicleId))
      .orderBy(desc(vehicleHistoryEvents.eventDate));
  } catch (error: unknown) {
    logger.error('Error fetching vehicle history', { error: (error as Error).message });
    throw error;
  }
};

export const createVehicleHistoryEvent = async (data: NewVehicleHistoryEvent) => {
  try {
    const [created] = await db.insert(vehicleHistoryEvents).values(data).returning();
    return created;
  } catch (error: unknown) {
    logger.error('Error creating vehicle history event', { error: (error as Error).message });
    throw error;
  }
};
