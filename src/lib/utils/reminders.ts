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

  // Prisma retorna Prisma.Decimal | null — converta para number
  const kmFromExpenses: number | null =
    lastKmAgg._max.km != null ? Number(lastKmAgg._max.km) : null;

  const base: number | null = v?.odometerKm ?? null;

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
  message: string; // "Faltam 320 km", "Vence em 12 dias", etc.
};
