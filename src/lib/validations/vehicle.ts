import { VehicleFuel } from "@prisma/client";
import { z } from "zod";

/**
 * Padrões aceitos para placa de veículo no Brasil:
 *
 * - Mercosul: ABC1D23
 *   • Três letras, um número, uma letra, dois números
 *
 * - Antiga: AAA0000
 *   • Três letras e quatro números
 */
export const brazilMercosulPlateRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
export const brazilOldPlateRegex = /^[A-Z]{3}[0-9]{4}$/;

/**
 * Pré-processa a placa:
 * - Remove espaços
 * - Converte para maiúsculas
 * - Trata string vazia como valor ausente (undefined) para funcionar bem com .optional()
 */
const PlatePreprocessedSchema = z.preprocess(
  (rawValue) => {
    if (typeof rawValue !== "string") return rawValue;
    const trimmed = rawValue.trim();
    if (trimmed.length === 0) return undefined;
    return trimmed.toUpperCase().replace(/\s+/g, "");
  },
  z
    .string()
    .refine(
      (value) =>
        brazilMercosulPlateRegex.test(value) || brazilOldPlateRegex.test(value),
      {
        message:
          "Informe uma placa válida. Aceitamos Mercosul (ex.: ABC1D23) ou antiga (ex.: ABC1234).",
      }
    )
);

/**
 * Regras de criação de veículo:
 * - Pelo menos um dos campos (nickname ou plate) deve ser informado
 * - odometerKm, quando informado, deve ser inteiro e não negativo
 * - fuelDefault é opcional e usa enum do Prisma
 */
export const VehicleCreateSchema = z
  .object({
    nickname: z
      .string()
      .min(2, "O apelido deve ter pelo menos 2 caracteres.")
      .max(80, "O apelido deve ter no máximo 80 caracteres.")
      .optional(),

    plate: PlatePreprocessedSchema.optional(),

    odometerKm: z
      .number()
      .int("O hodômetro deve ser um número inteiro.")
      .nonnegative("O hodômetro não pode ser negativo.")
      .optional(),

    fuelDefault: z.nativeEnum(VehicleFuel).optional(),
  })
  .refine((data) => Boolean(data.nickname || data.plate), {
    message: "Informe pelo menos o apelido do veículo ou a placa.",
    path: ["nickname"],
  });

/**
 * Regras de atualização de veículo:
 * - Todos os campos são opcionais
 * - id é aceito para conveniência e validado como UUID
 */
export const VehicleUpdateSchema = VehicleCreateSchema.partial().extend({
  id: z
    .string()
    .uuid("O identificador do veículo deve ser um UUID válido.")
    .optional(),
});
