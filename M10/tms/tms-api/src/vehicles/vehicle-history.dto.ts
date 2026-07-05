import { z } from 'zod';

export const vehicleEventTypeSchema = z.enum([
  'purchase', // zakup
  'inspection', // przegląd
  'repair', // naprawa
  'accident', // kolizja / szkoda
  'mileage_reading', // odczyt przebiegu
  'status_change', // zmiana statusu
  'sold', // sprzedaż
]);

export const vehicleHistoryEventCreateInputSchema = z.object({
  event_type: vehicleEventTypeSchema,
  event_date: z.string().min(1),
  mileage_km: z.number().int().nonnegative().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type VehicleHistoryEventCreateInput = z.infer<
  typeof vehicleHistoryEventCreateInputSchema
>;
