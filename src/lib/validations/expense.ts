import { ExpenseStatus, ExpenseType, FuelType } from "@prisma/client";
import { z } from "zod";
import { ISODateOnlySchema } from "./date";
import { DecimalStringSchema } from "./decimal";

function isCloudinaryHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "res.cloudinary.com") return false;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return true;
    return parsed.pathname.startsWith(`/${cloudName}/`);
  } catch {
    return false;
  }
}

export const ExpenseAttachmentInputSchema = z.object({
  url: z
    .string()
    .refine(isCloudinaryHttpsUrl, "O anexo deve ser uma URL HTTPS do Cloudinary."),
  contentType: z
    .string()
    .max(120, "O tipo de conteúdo deve ter no máximo 120 caracteres.")
    .optional(),
  size: z
    .number()
    .int("O tamanho deve ser inteiro (bytes).")
    .positive("O tamanho deve ser maior que zero.")
    .optional(),
});

export const ExpenseCreateSchema = z
  .object({
    vehicleId: z
      .string()
      .uuid("O identificador do veículo deve ser um UUID válido."),

    type: z.nativeEnum(ExpenseType),

    status: z.nativeEnum(ExpenseStatus).optional(), // default PENDENTE no banco

    dateISO: ISODateOnlySchema, // será convertido para Date

    amount: DecimalStringSchema, // será convertido para Prisma.Decimal

    description: z
      .string()
      .min(2, "A descrição deve ter pelo menos 2 caracteres.")
      .max(300, "A descrição deve ter no máximo 300 caracteres."),

    /** Hodômetro percorrido (Trip A/B). Opcional. */
    km: DecimalStringSchema.optional(),

    /** >> NOVO: Km total do veículo (obrigatório) */
    vehicleOdometerKm: DecimalStringSchema, // required

    // Campos de abastecimento (obrigatórios se type=ABASTECIMENTO)
    fuelLiters: DecimalStringSchema.optional(),
    pricePerLiter: DecimalStringSchema.optional(),
    fuelType: z.nativeEnum(FuelType).optional(),
    station: z
      .string()
      .max(120, "O nome do posto deve ter no máximo 120 caracteres.")
      .optional(),

    attachments: z
      .array(ExpenseAttachmentInputSchema)
      .max(10, "Você pode enviar no máximo 10 anexos.")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.type !== "ABASTECIMENTO") return true;
      return (
        typeof data.fuelLiters !== "undefined" &&
        typeof data.pricePerLiter !== "undefined" &&
        typeof data.fuelType !== "undefined"
      );
    },
    {
      message:
        "Para despesas do tipo ABASTECIMENTO, informe 'fuelLiters', 'pricePerLiter' e 'fuelType'.",
      path: ["type"],
    }
  );

export const ABASTECIMENTO_FUEL_MESSAGES = {
  fuelLiters: "Informe os litros abastecidos.",
  pricePerLiter: "Informe o preço por litro.",
  fuelType: "Informe o tipo de combustível.",
} as const;

export type AbastecimentoFuelIssue = {
  path: "fuelLiters" | "pricePerLiter" | "fuelType";
  message: string;
};

/** Campos obrigatórios quando o tipo resultante é ABASTECIMENTO. */
export function abastecimentoFuelIssues(fields: {
  fuelLiters?: unknown;
  pricePerLiter?: unknown;
  fuelType?: unknown;
}): AbastecimentoFuelIssue[] {
  const issues: AbastecimentoFuelIssue[] = [];
  if (fields.fuelLiters == null || fields.fuelLiters === "") {
    issues.push({
      path: "fuelLiters",
      message: ABASTECIMENTO_FUEL_MESSAGES.fuelLiters,
    });
  }
  if (fields.pricePerLiter == null || fields.pricePerLiter === "") {
    issues.push({
      path: "pricePerLiter",
      message: ABASTECIMENTO_FUEL_MESSAGES.pricePerLiter,
    });
  }
  if (fields.fuelType == null || fields.fuelType === "") {
    issues.push({
      path: "fuelType",
      message: ABASTECIMENTO_FUEL_MESSAGES.fuelType,
    });
  }
  return issues;
}

export const ExpenseUpdateSchema = z
  .object({
    vehicleId: z
      .string()
      .uuid("O identificador do veículo deve ser um UUID válido.")
      .optional(),

    type: z.nativeEnum(ExpenseType).optional(),

    status: z.nativeEnum(ExpenseStatus).optional(),

    dateISO: ISODateOnlySchema.optional(),

    amount: DecimalStringSchema.optional(),

    description: z
      .string()
      .min(2, "A descrição deve ter pelo menos 2 caracteres.")
      .max(300, "A descrição deve ter no máximo 300 caracteres.")
      .optional(),

    km: DecimalStringSchema.nullable().optional(),

    /** Odômetro total do veículo. Opcional na edição; não reduz o valor atual. */
    vehicleOdometerKm: DecimalStringSchema.optional(),

    fuelLiters: DecimalStringSchema.optional(),
    pricePerLiter: DecimalStringSchema.optional(),
    fuelType: z.nativeEnum(FuelType).optional(),
    station: z
      .string()
      .max(120, "O nome do posto deve ter no máximo 120 caracteres.")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "ABASTECIMENTO") return;
    for (const issue of abastecimentoFuelIssues(data)) {
      ctx.addIssue({
        code: "custom",
        path: [issue.path],
        message: issue.message,
      });
    }
  });
