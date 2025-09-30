import { prisma } from "@/lib/prisma";
import {
  diffDays,
  getCurrentOdometer,
  ReminderComputed,
} from "@/lib/reminders";
import { NextResponse } from "next/server";

/** GET /api/reminders?vehicleId=...&onlyActive=1 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || "";
  const onlyActive = searchParams.get("onlyActive") === "1";

  const rules = await prisma.reminderRule.findMany({
    where: {
      ...(vehicleId ? { vehicleId } : {}),
      ...(onlyActive ? { isActive: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  const today = new Date();
  const out: ReminderComputed[] = [];

  for (const r of rules) {
    let status: "OK" | "DUE_SOON" | "OVERDUE" = "OK";
    let message = "Sem previsão.";

    // por km/tempo (periodicidade)
    if (r.everyKm || r.everyDays) {
      const kmRef = r.lastDoneKm ?? 0;
      const dateRef = r.lastDoneAt ?? r.createdAt;

      // por km
      if (r.everyKm) {
        const odo = r.vehicleId ? await getCurrentOdometer(r.vehicleId) : null;
        if (odo != null) {
          const since = odo - kmRef;
          const left = r.everyKm - since;
          if (left <= 0) {
            status = "OVERDUE";
            message = `Passou ${Math.abs(left)} km do limite`;
          } else if (left <= (r.warnKmLeft ?? 500)) {
            status = "DUE_SOON";
            message = `Faltam ${left} km`;
          } else {
            message = `Faltam ${left} km`;
          }
        } else {
          message = "Sem odômetro atual.";
        }
      }

      // por dias
      if (r.everyDays) {
        const next = new Date(dateRef);
        next.setDate(next.getDate() + r.everyDays);
        const days = diffDays(today, next);
        if (days <= 0) {
          status = "OVERDUE";
          message = `Venceu há ${Math.abs(days)} dia(s)`;
        } else if (days <= (r.warnDaysLeft ?? 15)) {
          status = "DUE_SOON";
          message = `Vence em ${days} dia(s)`;
        } else {
          message = `Vence em ${days} dia(s)`;
        }
      }
    }

    // por data fixa (documentos/multas)
    if (r.dueDate) {
      const days = diffDays(today, r.dueDate);
      if (days <= 0) {
        status = "OVERDUE";
        message = `Venceu há ${Math.abs(days)} dia(s)`;
      } else if (days <= (r.warnDaysLeft ?? 15)) {
        status = "DUE_SOON";
        message = `Vence em ${days} dia(s)`;
      } else {
        message = `Vence em ${days} dia(s)`;
      }
    }

    out.push({
      id: r.id,
      vehicleId: r.vehicleId ?? null,
      type: r.type,
      title: r.title,
      notes: r.notes,
      status,
      message,
    });
  }

  return NextResponse.json(out, { status: 200 });
}

/** POST /api/reminders  (criar regra) */
export async function POST(req: Request) {
  const body = await req.json();
  // validação simples (MVP)
  if (!body || !body.userId || !body.title || !body.type) {
    return NextResponse.json(
      { error: "Campos obrigatórios: userId, type, title" },
      { status: 400 }
    );
  }

  const created = await prisma.reminderRule.create({
    data: {
      userId: body.userId,
      vehicleId: body.vehicleId ?? null,
      type: body.type,
      title: body.title,
      notes: body.notes ?? null,
      everyKm: body.everyKm ?? null,
      everyDays: body.everyDays ?? null,
      lastDoneKm: body.lastDoneKm ?? null,
      lastDoneAt: body.lastDoneAt ? new Date(body.lastDoneAt) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      warnKmLeft: body.warnKmLeft ?? 500,
      warnDaysLeft: body.warnDaysLeft ?? 15,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
