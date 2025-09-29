import { z } from "zod";

// Auxiliares para números com 2 casas decimais
const moneyNumber = z.number().min(0).max(9_999_999).multipleOf(0.01);
const decimal2 = z.number().min(0).max(9_999_999).multipleOf(0.01);

export const expenseCreateSchema = z.object({
  vehicleId: z.string().uuid(),
  type: z.enum([
    "ABASTECIMENTO",
    "MANUTENCAO",
    "IMPOSTO",
    "SEGURO",
    "MULTA",
    "OUTRO",
  ]),
  status: z.enum(["PAGO", "PENDENTE"]).optional().default("PENDENTE"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // yyyy-mm-dd
  amount: moneyNumber,
  description: z.string().trim().min(1).max(300),
  km: z.number().int().min(0).max(9_999_999).optional().nullable(),

  // Campos específicos de abastecimento
  fuelLiters: decimal2.optional().nullable(),
  pricePerLiter: decimal2.optional().nullable(),
  fuelType: z
    .enum(["GASOLINA", "ETANOL", "DIESEL", "GNV"])
    .optional()
    .nullable(),
  station: z.string().trim().max(120).optional().nullable(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

export const expenseListQuerySchema = z.object({
  vehicleId: z.string().uuid().optional(),
  type: z
    .enum([
      "ABASTECIMENTO",
      "MANUTENCAO",
      "IMPOSTO",
      "SEGURO",
      "MULTA",
      "OUTRO",
    ])
    .optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});
