export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { ReminderCreateSchema } from "@/lib/validations/reminder";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function parseDateOnlyToUTC(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageIndex = Number(searchParams.get("pageIndex") ?? "0");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const vehicleId = searchParams.get("vehicleId") ?? undefined;

    const where = {
      userId: session.user.id,
      ...(vehicleId ? { vehicleId } : {}),
    };

    const [reminderRules, totalCount] = await Promise.all([
      prisma.reminderRule.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      prisma.reminderRule.count({ where }),
    ]);

    return NextResponse.json(
      { data: reminderRules, totalCount },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro ao listar lembretes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const requestBody = await request.json();
    const validationResult = ReminderCreateSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao criar lembrete.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const {
      vehicleId,
      type,
      title,
      notes,
      everyKm,
      everyDays,
      lastDoneKm,
      lastDoneAtISO,
      dueDateISO,
      warnKmLeft,
      warnDaysLeft,
      isActive,
    } = validationResult.data;

    // ⚠️ Blindagem: se a regra é por KM e lastDoneKm não foi informado,
    // usa o odômetro atual do veículo como âncora (se houver).
    let resolvedLastDoneKm: number | null = lastDoneKm ?? null;
    if (resolvedLastDoneKm == null && everyKm && vehicleId) {
      const v = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { odometerKm: true },
      });
      if (typeof v?.odometerKm === "number") {
        resolvedLastDoneKm = v.odometerKm;
      }
    }

    const createdReminder = await prisma.reminderRule.create({
      data: {
        userId: session.user.id,
        vehicleId: vehicleId ?? null,
        type,
        title,
        notes: notes ?? null,
        everyKm: everyKm ?? null,
        everyDays: everyDays ?? null,
        lastDoneKm: resolvedLastDoneKm, // << usa âncora resolvida
        lastDoneAt: lastDoneAtISO ? parseDateOnlyToUTC(lastDoneAtISO) : null,
        dueDate: dueDateISO ? parseDateOnlyToUTC(dueDateISO) : null,
        warnKmLeft: warnKmLeft ?? undefined,
        warnDaysLeft: warnDaysLeft ?? undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      },
    });

    return NextResponse.json({ data: createdReminder }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao criar lembrete." },
      { status: 500 }
    );
  }
}
