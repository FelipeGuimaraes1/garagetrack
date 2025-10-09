export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { ReminderUpdateSchema } from "@/lib/validations/reminder";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function parseDateOnlyToUTC(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Next 15+: nas rotas dinâmicas de API, `params` é assíncrono,
 * então tipamos como Promise e usamos `await`.
 */
type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const { id: reminderId } = await ctx.params;

    const existing = await prisma.reminderRule.findFirst({
      where: { id: reminderId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Lembrete não encontrado." },
        { status: 404 }
      );
    }

    const body = await request.json();

    // --- AÇÃO: markDone ------------------------------------------------------
    if (body?.action === "markDone") {
      const currentOdometer =
        typeof body.currentOdometer === "number" &&
        !Number.isNaN(body.currentOdometer)
          ? Math.max(0, Math.trunc(body.currentOdometer))
          : null;

      const doneAt: Date =
        typeof body.doneAt === "string" && body.doneAt
          ? parseDateOnlyToUTC(body.doneAt)
          : new Date();

      const updated = await prisma.reminderRule.update({
        where: { id: reminderId },
        data: {
          lastDoneKm: currentOdometer,
          lastDoneAt: doneAt,
        },
      });

      return NextResponse.json({ data: updated }, { status: 200 });
    }

    // --- AÇÃO: snooze --------------------------------------------------------
    if (body?.action === "snooze") {
      const days = Number(body.days);
      if (!Number.isFinite(days) || days <= 0) {
        return NextResponse.json(
          { error: "Parâmetro 'days' inválido." },
          { status: 400 }
        );
      }

      const base = existing.dueDate ?? new Date();
      const next = new Date(base);
      next.setDate(next.getDate() + Math.trunc(days));

      const updated = await prisma.reminderRule.update({
        where: { id: reminderId },
        data: { dueDate: next },
      });

      return NextResponse.json({ data: updated }, { status: 200 });
    }

    // --- UPDATE padrão validado pelo Zod ------------------------------------
    const validationResult = ReminderUpdateSchema.safeParse({
      ...body,
      id: reminderId,
    });
    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao atualizar lembrete.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const dataToUpdate = { ...validationResult.data } as any;
    delete dataToUpdate.id;

    const prismaData: any = {};
    if (typeof dataToUpdate.vehicleId !== "undefined")
      prismaData.vehicleId = dataToUpdate.vehicleId;
    if (typeof dataToUpdate.type !== "undefined")
      prismaData.type = dataToUpdate.type;
    if (typeof dataToUpdate.title !== "undefined")
      prismaData.title = dataToUpdate.title;
    if (typeof dataToUpdate.notes !== "undefined")
      prismaData.notes = dataToUpdate.notes ?? null;
    if (typeof dataToUpdate.everyKm !== "undefined")
      prismaData.everyKm = dataToUpdate.everyKm ?? null;
    if (typeof dataToUpdate.everyDays !== "undefined")
      prismaData.everyDays = dataToUpdate.everyDays ?? null;
    if (typeof dataToUpdate.lastDoneKm !== "undefined")
      prismaData.lastDoneKm = dataToUpdate.lastDoneKm ?? null;
    if (typeof dataToUpdate.lastDoneAtISO !== "undefined")
      prismaData.lastDoneAt = dataToUpdate.lastDoneAtISO
        ? parseDateOnlyToUTC(dataToUpdate.lastDoneAtISO)
        : null;
    if (typeof dataToUpdate.dueDateISO !== "undefined")
      prismaData.dueDate = dataToUpdate.dueDateISO
        ? parseDateOnlyToUTC(dataToUpdate.dueDateISO)
        : null;
    if (typeof dataToUpdate.warnKmLeft !== "undefined")
      prismaData.warnKmLeft = dataToUpdate.warnKmLeft;
    if (typeof dataToUpdate.warnDaysLeft !== "undefined")
      prismaData.warnDaysLeft = dataToUpdate.warnDaysLeft;
    if (typeof dataToUpdate.isActive !== "undefined")
      prismaData.isActive = dataToUpdate.isActive;

    const updatedReminder = await prisma.reminderRule.update({
      where: { id: reminderId },
      data: prismaData,
    });

    return NextResponse.json({ data: updatedReminder }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao atualizar lembrete." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const { id: reminderId } = await ctx.params;

    const existing = await prisma.reminderRule.findFirst({
      where: { id: reminderId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Lembrete não encontrado." },
        { status: 404 }
      );
    }

    await prisma.reminderRule.delete({ where: { id: reminderId } });

    return NextResponse.json(
      { message: "Lembrete excluído com sucesso." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro ao excluir lembrete." },
      { status: 500 }
    );
  }
}
