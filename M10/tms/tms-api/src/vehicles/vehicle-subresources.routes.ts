import { Request, Response } from 'express';
import express from 'express';

import {
  getVehicleDocuments,
  createVehicleDocument,
  deleteVehicleDocument,
  getVehicleHistory,
  createVehicleHistoryEvent,
} from './vehicle-subresources.queries';
import { vehicleExists } from './vehicles.queries';
import { vehicleDocumentCreateInputSchema } from './vehicle-documents.dto';
import { vehicleHistoryEventCreateInputSchema } from './vehicle-history.dto';
import logger from '../logger';
import { parsePathId } from '../shared/query-parsers';
import { ErrorResponse } from '../types/data-contracts';

// mergeParams so the parent :id (vehicle id) is available here.
const router = express.Router({ mergeParams: true });

const formatZodError = (issues: { message: string }[]) =>
  issues.map((i) => i.message).join(', ');

const resolveVehicleId = (req: Request, res: Response): number | null => {
  const id = parsePathId((req.params as { id?: string }).id);
  if (id === null) {
    res.status(400).json({ error: 'Vehicle ID must be a positive integer' });
    return null;
  }
  return id;
};

// ─── documents ───────────────────────────────────────────────────────────────

router.get('/documents', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const vehicleId = resolveVehicleId(req, res);
  if (vehicleId === null) return;
  try {
    if (!(await vehicleExists(vehicleId))) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const documents = await getVehicleDocuments(vehicleId);
    res.json({ data: documents });
  } catch (error: unknown) {
    logger.error('Failed to fetch vehicle documents', {
      error: { message: (error as Error).message },
      vehicle_id: vehicleId,
    });
    res.status(500).json({ error: 'Failed to fetch vehicle documents' });
  }
});

router.post('/documents', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const vehicleId = resolveVehicleId(req, res);
  if (vehicleId === null) return;
  const parsed = vehicleDocumentCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    if (!(await vehicleExists(vehicleId))) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const document = await createVehicleDocument({
      vehicleId,
      docType: parsed.data.doc_type,
      documentNumber: parsed.data.document_number ?? null,
      issueDate: parsed.data.issue_date ?? null,
      expiryDate: parsed.data.expiry_date ?? null,
      fileUrl: parsed.data.file_url ?? null,
      notes: parsed.data.notes ?? null,
    });
    logger.info('Vehicle document created', { vehicle_id: vehicleId, document_id: document.id });
    res.status(201).json(document);
  } catch (error: unknown) {
    logger.error('Failed to create vehicle document', {
      error: { message: (error as Error).message },
      vehicle_id: vehicleId,
    });
    res.status(500).json({ error: 'Failed to create vehicle document' });
  }
});

router.delete('/documents/:docId', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const vehicleId = resolveVehicleId(req, res);
  if (vehicleId === null) return;
  const docId = parsePathId(req.params.docId);
  if (docId === null) {
    return res.status(400).json({ error: 'Document ID must be a positive integer' });
  }
  try {
    const deleted = await deleteVehicleDocument(vehicleId, docId);
    if (!deleted) {
      return res.status(404).json({ error: 'Vehicle document not found' });
    }
    logger.info('Vehicle document deleted', { vehicle_id: vehicleId, document_id: docId });
    res.status(204).send();
  } catch (error: unknown) {
    logger.error('Failed to delete vehicle document', {
      error: { message: (error as Error).message },
      vehicle_id: vehicleId,
      document_id: docId,
    });
    res.status(500).json({ error: 'Failed to delete vehicle document' });
  }
});

// ─── history ─────────────────────────────────────────────────────────────────

router.get('/history', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const vehicleId = resolveVehicleId(req, res);
  if (vehicleId === null) return;
  try {
    if (!(await vehicleExists(vehicleId))) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const history = await getVehicleHistory(vehicleId);
    res.json({ data: history });
  } catch (error: unknown) {
    logger.error('Failed to fetch vehicle history', {
      error: { message: (error as Error).message },
      vehicle_id: vehicleId,
    });
    res.status(500).json({ error: 'Failed to fetch vehicle history' });
  }
});

router.post('/history', async (req: Request, res: Response<unknown | ErrorResponse>) => {
  const vehicleId = resolveVehicleId(req, res);
  if (vehicleId === null) return;
  const parsed = vehicleHistoryEventCreateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: formatZodError(parsed.error.issues) });
  }
  try {
    if (!(await vehicleExists(vehicleId))) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const event = await createVehicleHistoryEvent({
      vehicleId,
      eventType: parsed.data.event_type,
      eventDate: parsed.data.event_date,
      mileageKm: parsed.data.mileage_km ?? null,
      description: parsed.data.description ?? null,
    });
    logger.info('Vehicle history event created', { vehicle_id: vehicleId, event_id: event.id });
    res.status(201).json(event);
  } catch (error: unknown) {
    logger.error('Failed to create vehicle history event', {
      error: { message: (error as Error).message },
      vehicle_id: vehicleId,
    });
    res.status(500).json({ error: 'Failed to create vehicle history event' });
  }
});

export default router;
