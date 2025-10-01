import { prisma } from "@/lib/prisma";
import { diffDays, getCurrentOdometer } from "@/lib/reminders";
import { NextResponse } from "next/server";

/** TOP 3 próximos lembretes (mistura data e km) */
export async function GET() {
  const rules = await prisma.reminderRule.findMany({
    where: { isActive: true },
    include: { vehicle: { select: { id: true, nickname: true, plate: true } } },
  });

  const today = new Date();

  type Item = {
    id: string;
    title: string;
    type: string;
    vehicleLabel: string | null;
    hint: string; // "em 5 dias" / "faltam 300 km"
    urgencyScore: number; // menor = mais urgente
  };

  const items: Item[] = [];

  for (const r of rules) {
    let bestScore: number | null = null;
    let bestHint = "Sem previsão";

    // por data fixa
    if (r.dueDate) {
      const days = diffDays(today, r.dueDate);
      bestScore = Math.max(days, -365); // quanto menor, mais urgente (pode ser negativo)
      bestHint = days <= 0 ? `vencido há ${Math.abs(days)} d` : `em ${days} d`;
    }

    // por dias
    if (r.everyDays) {
      const ref = r.lastDoneAt ?? r.createdAt;
      const next = new Date(ref);
      next.setDate(next.getDate() + r.everyDays);
      const days = diffDays(today, next);
      const score = Math.max(days, -365);
      if (bestScore === null || score < bestScore) {
        bestScore = score;
        bestHint =
          days <= 0 ? `vencido há ${Math.abs(days)} d` : `em ${days} d`;
      }
    }

    // por km
    if (r.everyKm && r.vehicleId) {
      const odo = await getCurrentOdometer(r.vehicleId);
      if (odo != null) {
        const since = odo - (r.lastDoneKm ?? 0);
        const left = r.everyKm - since; // pode ser <= 0
        const score = left / 50; // normalizo para a mesma ordem de grandeza de "dias"
        if (bestScore === null || score < bestScore) {
          bestScore = score;
          bestHint =
            left <= 0 ? `passou ${Math.abs(left)} km` : `faltam ${left} km`;
        }
      }
    }

    if (bestScore !== null) {
      items.push({
        id: r.id,
        title: r.title,
        type: r.type,
        vehicleLabel: r.vehicle ? r.vehicle.nickname || r.vehicle.plate : null,
        hint: bestHint,
        urgencyScore: bestScore,
      });
    }
  }

  items.sort((a, b) => a.urgencyScore - b.urgencyScore);
  return NextResponse.json(items.slice(0, 3), { status: 200 });
}
