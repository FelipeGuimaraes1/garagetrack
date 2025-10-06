import { z } from "zod";

/**
 * Aceita number ou string e garante até 2 casas decimais (ex.: "1234.56").
 * Retorna string normalizada para uso com Prisma.Decimal.
 */
export const DecimalStringSchema = z
  .union([z.number(), z.string()])
  .transform((value) => (typeof value === "number" ? value.toString() : value))
  .refine(
    (value) => {
      if (typeof value !== "string") return false;
      return /^-?\d+(\.\d{1,2})?$/.test(value.trim());
    },
    { message: "Use no máximo 2 casas decimais." }
  );
