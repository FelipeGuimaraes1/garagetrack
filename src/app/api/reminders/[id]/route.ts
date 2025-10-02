import { prisma } from "@/lib/utils/db";
import { NextResponse } from "next/server";

/** PATCH /api/reminders/:id
 *  - atualizar campos
 *  - action "markDone": { currentOdometer?: number, doneAt?: string }
 *  - action "snooze": { days: number }  (implementado abaixo)
 */
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await _req.json();

  if (body?.action === "markDone") {
    const data: any = {};
    data.lastDoneAt = body.doneAt ? new Date(body.doneAt) : new Date();
    if (
      typeof body.currentOdometer === "number" &&
      !Number.isNaN(body.currentOdometer)
    ) {
      data.lastDoneKm = body.currentOdometer;
    }
    const updated = await prisma.reminderRule.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  }

  if (body?.action === "snooze") {
    const days = Number(body?.days ?? 0);
    if (!days || Number.isNaN(days) || days < 1) {
      return NextResponse.json(
        { error: "Informe 'days' >= 1" },
        { status: 400 }
      );
    }

    const rule = await prisma.reminderRule.findUnique({ where: { id } });
    if (!rule)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Caso 1: data fixa → apenas empurra a dueDate
    if (rule.dueDate) {
      const next = new Date(rule.dueDate);
      next.setDate(next.getDate() + days);
      const updated = await prisma.reminderRule.update({
        where: { id },
        data: { dueDate: next },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // Caso 2: periodicidade em dias → empurra a referência (lastDoneAt)
    if (rule.everyDays) {
      const ref = rule.lastDoneAt ?? rule.createdAt;
      const next = new Date(ref);
      next.setDate(next.getDate() + days);
      const updated = await prisma.reminderRule.update({
        where: { id },
        data: { lastDoneAt: next },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // Caso 3: só km → não dá para “snooze” por dias; retornar 409
    return NextResponse.json(
      { error: "Regra baseada em km não suporta adiar por dias." },
      { status: 409 }
    );
  }

  // PATCH “normal”
  const updated = await prisma.reminderRule.update({
    where: { id },
    data: {
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

  return NextResponse.json(updated, { status: 200 });
}

/** DELETE /api/reminders/:id */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.reminderRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
