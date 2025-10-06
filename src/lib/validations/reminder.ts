import { ReminderType } from "@prisma/client";
import { z } from "zod";
import { ISODateOnlySchema } from "./date";

export const ReminderCreateSchema = z
  .object({
    vehicleId: z
      .string()
      .uuid("O identificador do veículo deve ser um UUID válido.")
      .nullable()
      .optional(),

    type: z.nativeEnum(ReminderType),

    title: z
      .string()
      .min(2, "O título deve ter pelo menos 2 caracteres.")
      .max(120, "O título deve ter no máximo 120 caracteres."),

    notes: z
      .string()
      .max(500, "As observações devem ter no máximo 500 caracteres.")
      .optional(),

    everyKm: z
      .number()
      .int("A recorrência por quilômetros deve ser inteira.")
      .positive("A recorrência por quilômetros deve ser maior que zero.")
      .optional(),

    everyDays: z
      .number()
      .int("A recorrência por dias deve ser inteira.")
      .positive("A recorrência por dias deve ser maior que zero.")
      .optional(),

    lastDoneKm: z
      .number()
      .int("O último hodômetro deve ser inteiro.")
      .nonnegative("O último hodômetro não pode ser negativo.")
      .optional(),

    lastDoneAtISO: ISODateOnlySchema.optional(),

    dueDateISO: ISODateOnlySchema.optional(),

    warnKmLeft: z
      .number()
      .int("O aviso por quilômetros restantes deve ser inteiro.")
      .positive("O aviso por quilômetros restantes deve ser maior que zero.")
      .optional(),

    warnDaysLeft: z
      .number()
      .int("O aviso por dias restantes deve ser inteiro.")
      .positive("O aviso por dias restantes deve ser maior que zero.")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Boolean(data.everyKm || data.everyDays || data.dueDateISO),
    {
      message:
        "Informe pelo menos um critério: 'everyKm', 'everyDays' ou 'dueDateISO'.",
      path: ["title"],
    }
  );

export const ReminderUpdateSchema = ReminderCreateSchema.partial().extend({
  id: z
    .string()
    .uuid("O identificador do lembrete deve ser um UUID válido.")
    .optional(),
});
