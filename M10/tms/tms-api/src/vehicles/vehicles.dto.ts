import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { vehicles } from '../drizzle/schema.js';
import { paginationSchema } from '../shared/pagination.types.js';

export const vehicleKindSchema = z.enum(['TRACTOR_UNIT', 'SEMI_TRAILER']);

// Type-specific technical attributes stored as JSONB.
//   TRACTOR_UNIT: { power_kw, euro_norm, axles, fuel_type }
//   SEMI_TRAILER: { euro_pallets, volume_m3, interior_height_m, has_tail_lift, has_refrigeration }
// Kept intentionally loose — DB stores raw JSONB; the shape is documented, not enforced.
export const vehicleSpecsSchema = z.record(z.string(), z.unknown());

export const vehicleDtoSchema = createSelectSchema(vehicles);

export const vehicleListResponseSchema = z.object({
  data: z.array(vehicleDtoSchema),
  pagination: paginationSchema,
});

export const vehicleCreateInputSchema = z.object({
  // legacy fields (kept for backward compatibility)
  make: z.string().max(50).optional().nullable(),
  model: z.string().max(50).optional().nullable(),
  year: z.number().int().optional().nullable(),
  fuel_tank_capacity: z.number().positive().optional().nullable(),
  // catalog + instance fields
  model_id: z.number().int().positive().optional().nullable(),
  kind: vehicleKindSchema.optional().nullable(),
  registration_number: z.string().max(20).optional().nullable(),
  vin: z.string().max(17).optional().nullable(),
  first_registration_date: z.string().optional().nullable(),
  mileage_km: z.number().int().nonnegative().optional().nullable(),
  status: z.string().max(20).optional().nullable(),
  specs: vehicleSpecsSchema.optional().nullable(),
});

export const vehicleUpdateInputSchema = vehicleCreateInputSchema.partial();

export type VehicleDto = z.infer<typeof vehicleDtoSchema>;
export type VehicleListResponse = z.infer<typeof vehicleListResponseSchema>;
export type VehicleCreateInput = z.infer<typeof vehicleCreateInputSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateInputSchema>;
