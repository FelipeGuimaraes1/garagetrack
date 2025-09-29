import { z } from "zod";

export const vehicleCreateSchema = z.object({
  nickname: z.string().trim().max(60).optional().nullable(),
  plate: z.string().trim().max(10).optional().nullable(),
  fuelDefault: z
    .enum(["GASOLINA", "ETANOL", "DIESEL", "GNV", "FLEX"])
    .optional()
    .nullable(),
  odometerKm: z.number().int().min(0).max(9_999_999).optional().nullable(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();
