import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** PATCH /api/reminders/:id
 *  - atualizar campos
 *  - ou marcar como feito: { action: "markDone", currentOdometer?: number }
 */
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await _req.json();

  if (body?.action === "markDone") {
    const data: any = { lastDoneAt: new Date() };
    if (typeof body.currentOdometer === "number")
      data.lastDoneKm = body.currentOdometer;
    const updated = await prisma.reminderRule.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  }

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
