import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { vehicleModels } from '../drizzle/schema.js';
import { paginationSchema } from '../shared/pagination.types.js';

export const vehicleKindSchema = z.enum(['TRACTOR_UNIT', 'SEMI_TRAILER']);

// Rodzaje naczep (semi-trailer body types)
export const trailerTypeSchema = z.enum([
  'reefer', // chłodnia
  'curtain', // firanka / plandeka
  'isotherm', // izoterma
  'tipper', // wywrotka
  'platform', // platforma
  'tank', // cysterna
  'container', // podkontenerowa
]);

export const vehicleModelDtoSchema = createSelectSchema(vehicleModels);

export const vehicleModelListResponseSchema = z.object({
  data: z.array(vehicleModelDtoSchema),
  pagination: paginationSchema,
});

// Ciągnik nie ma trailer_type; naczepa musi mieć trailer_type.
const trailerTypeRule = (
  data: { kind?: string | null; trailerType?: string | null },
  ctx: z.RefinementCtx
) => {
  if (data.kind === 'SEMI_TRAILER' && !data.trailerType) {
    ctx.addIssue({
      code: 'custom',
      path: ['trailerType'],
      message: 'trailerType is required for SEMI_TRAILER models',
    });
  }
  if (data.kind === 'TRACTOR_UNIT' && data.trailerType) {
    ctx.addIssue({
      code: 'custom',
      path: ['trailerType'],
      message: 'trailerType must be empty for TRACTOR_UNIT models',
    });
  }
};

export const vehicleModelCreateInputSchema = z
  .object({
    brandId: z.number().int().positive(),
    name: z.string().min(1).max(120),
    kind: vehicleKindSchema,
    trailerType: trailerTypeSchema.optional().nullable(),
  })
  .superRefine(trailerTypeRule);

export const vehicleModelUpdateInputSchema = z
  .object({
    brandId: z.number().int().positive().optional(),
    name: z.string().min(1).max(120).optional(),
    kind: vehicleKindSchema.optional(),
    trailerType: trailerTypeSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Only enforce the rule when kind is being (re)set in this update.
    if (data.kind !== undefined) trailerTypeRule(data, ctx);
  });

export type VehicleKind = z.infer<typeof vehicleKindSchema>;
export type TrailerType = z.infer<typeof trailerTypeSchema>;
export type VehicleModelDto = z.infer<typeof vehicleModelDtoSchema>;
export type VehicleModelListResponse = z.infer<typeof vehicleModelListResponseSchema>;
export type VehicleModelCreateInput = z.infer<typeof vehicleModelCreateInputSchema>;
export type VehicleModelUpdateInput = z.infer<typeof vehicleModelUpdateInputSchema>;
