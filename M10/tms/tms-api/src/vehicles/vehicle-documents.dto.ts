import { z } from 'zod';

export const vehicleDocTypeSchema = z.enum([
  'registration_certificate', // dowód rejestracyjny
  'insurance_oc', // OC
  'insurance_ac', // AC / autocasco
  'technical_inspection', // badanie techniczne (SKP)
  'tachograph', // legalizacja tachografu
  'atp_certificate', // świadectwo ATP (chłodnia)
  'other',
]);

export const vehicleDocumentCreateInputSchema = z.object({
  doc_type: vehicleDocTypeSchema,
  document_number: z.string().max(60).optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  file_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type VehicleDocumentCreateInput = z.infer<typeof vehicleDocumentCreateInputSchema>;
