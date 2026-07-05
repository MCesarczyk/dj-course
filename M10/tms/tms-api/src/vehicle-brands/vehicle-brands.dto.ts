import { z } from 'zod';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { vehicleBrands } from '../drizzle/schema.js';
import { paginationSchema } from '../shared/pagination.types.js';

export const vehicleBrandDtoSchema = createSelectSchema(vehicleBrands);

export const vehicleBrandListResponseSchema = z.object({
  data: z.array(vehicleBrandDtoSchema),
  pagination: paginationSchema,
});

export const vehicleBrandCreateInputSchema = createInsertSchema(vehicleBrands)
  .omit({ id: true })
  .extend({
    name: z.string().min(1).max(80),
    country: z.string().max(80).optional().nullable(),
  });

export const vehicleBrandUpdateInputSchema = vehicleBrandCreateInputSchema.partial();

export type VehicleBrandDto = z.infer<typeof vehicleBrandDtoSchema>;
export type VehicleBrandListResponse = z.infer<typeof vehicleBrandListResponseSchema>;
export type VehicleBrandCreateInput = z.infer<typeof vehicleBrandCreateInputSchema>;
export type VehicleBrandUpdateInput = z.infer<typeof vehicleBrandUpdateInputSchema>;
