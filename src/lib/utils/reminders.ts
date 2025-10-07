import { prisma } from "@/lib/utils/db";

/** busca odômetro "atual" do veículo: max(vehicle.odometerKm, maior km das despesas) */
export async function getCurrentOdometer(
  vehicleId: string
): Promise<number | null> {
  const v = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { odometerKm: true },
  });
  const lastKmAgg = await prisma.expense.aggregate({
    where: { vehicleId },
    _max: { km: true },
  });

  // Valores podem vir como number ou Decimal – normalize para number
  const kmFromExpensesRaw: any = lastKmAgg._max.km ?? null;
  const kmFromExpenses =
    kmFromExpensesRaw == null
      ? null
      : typeof kmFromExpensesRaw === "number"
      ? kmFromExpensesRaw
      : Number(kmFromExpensesRaw);

  const base =
    v?.odometerKm == null ? null : (v.odometerKm as unknown as number);

  if (base == null && kmFromExpenses == null) return null;
  return Math.max(base ?? 0, kmFromExpenses ?? 0);
}

export function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / 86_400_000); // 1000*60*60*24
}

export type ReminderComputed = {
  id: string;
  vehicleId: string | null;
  type: string;
  title: string;
  notes?: string | null;
  status: "OK" | "DUE_SOON" | "OVERDUE"; // ok / chegando / vencido
  message: string; // "Faltam 320 km", "Venceu por 120 km", etc.
};

/** Avalia um lembrete por KM dado o novo odômetro do veículo. */
export function computeKmStatusForRule(params: {
  everyKm: number;
  lastDoneKm?: number | null;
  warnKmLeft?: number | null;
  currentOdo: number;
}): { status: "OK" | "DUE_SOON" | "OVERDUE"; left: number } {
  const { everyKm, lastDoneKm, warnKmLeft, currentOdo } = params;
  const since = currentOdo - (lastDoneKm ?? 0);
  const left = everyKm - since;
  if (left <= 0) return { status: "OVERDUE", left };
  const warn = typeof warnKmLeft === "number" ? warnKmLeft : 500;
  if (left <= warn) return { status: "DUE_SOON", left };
  return { status: "OK", left };
}
