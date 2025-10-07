import { ExpenseStatus, ExpenseType, FuelType } from "@prisma/client";
import { z } from "zod";
import { ISODateOnlySchema } from "./date";
import { DecimalStringSchema } from "./decimal";

const urlRegex = /^(https?:\/\/)([\w.-]+)(:[0-9]+)?(\/[\w\-./?%&=]*)?$/i;

export const ExpenseAttachmentInputSchema = z.object({
  url: z.string().regex(urlRegex, "A URL do anexo deve ser válida."),
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

export const ExpenseUpdateSchema = ExpenseCreateSchema.partial().extend({
  id: z
    .string()
    .uuid("O identificador da despesa deve ser um UUID válido.")
    .optional(),
});
