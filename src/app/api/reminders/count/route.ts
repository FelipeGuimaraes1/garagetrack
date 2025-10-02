import { prisma } from "@/lib/utils/db";
import { diffDays, getCurrentOdometer } from "@/lib/utils/reminders";
import { NextResponse } from "next/server";

/** Conta quantos lembretes estão DUE_SOON ou OVERDUE (filtros opcionais) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || "";
  const onlyActive = searchParams.get("onlyActive") === "1";

  const rules = await prisma.reminderRule.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      ...(onlyActive ? { isActive: true } : {}),
    },
    select: {
      id: true,
      vehicleId: true,
      type: true,
      title: true,
      notes: true,
      everyKm: true,
      everyDays: true,
      lastDoneKm: true,
      lastDoneAt: true,
      dueDate: true,
      warnKmLeft: true,
      warnDaysLeft: true,
      createdAt: true,
    },
  });

  const today = new Date();
  let count = 0;

  for (const r of rules) {
    let status: "OK" | "DUE_SOON" | "OVERDUE" = "OK";

    if (r.everyKm || r.everyDays) {
      const kmRef = r.lastDoneKm ?? 0;
      const dateRef = r.lastDoneAt ?? r.createdAt;
      if (r.everyKm) {
        const odo = r.vehicleId ? await getCurrentOdometer(r.vehicleId) : null;
        if (odo != null) {
          const since = odo - kmRef;
          const left = (r.everyKm ?? 0) - since;
          status =
            left <= 0
              ? "OVERDUE"
              : left <= (r.warnKmLeft ?? 500)
              ? "DUE_SOON"
              : status;
        }
      }
      if (r.everyDays) {
        const next = new Date(dateRef);
        next.setDate(next.getDate() + r.everyDays);
        const days = diffDays(today, next);
        status =
          days <= 0
            ? "OVERDUE"
            : days <= (r.warnDaysLeft ?? 15)
            ? "DUE_SOON"
            : status;
      }
    }
    if (r.dueDate) {
      const days = diffDays(today, r.dueDate);
      status =
        days <= 0
          ? "OVERDUE"
          : days <= (r.warnDaysLeft ?? 15)
          ? "DUE_SOON"
          : status;
    }

    if (status === "DUE_SOON" || status === "OVERDUE") count++;
  }

  return NextResponse.json({ count }, { status: 200 });
}
