import { z } from "zod";

/**
 * Valida o formato "YYYY-MM-DD" (ISO calendar date) sem horário.
 */
export const ISODateOnlySchema = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Informe a data no formato YYYY-MM-DD.",
  });
