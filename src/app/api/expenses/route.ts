export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { computeKmStatusForRule } from "@/lib/utils/reminders";
import { buildValidationError } from "@/lib/validations/errors";
import { ExpenseCreateSchema } from "@/lib/validations/expense";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Converte "YYYY-MM-DD" para Date UTC (meia-noite) — campo date é @db.Date.
 */
function parseDateOnlyToUTC(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map((value) => Number(value));
  return new Date(Date.UTC(year, month - 1, day));
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

    // Paginação padronizada (page = 1-based)
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") ?? "10"));
    const skip = (page - 1) * pageSize;

    // Filtros opcionais
    const vehicleId = searchParams.get("vehicleId") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const dateFromISO = searchParams.get("dateFrom") ?? undefined; // YYYY-MM-DD
    const dateToISO = searchParams.get("dateTo") ?? undefined; // YYYY-MM-DD

    const where: Prisma.ExpenseWhereInput = {
      userId: session.user.id,
      ...(vehicleId ? { vehicleId } : {}),
      ...(type ? { type: type as any } : {}),
      ...(dateFromISO || dateToISO
        ? {
            date: {
              ...(dateFromISO ? { gte: parseDateOnlyToUTC(dateFromISO) } : {}),
              ...(dateToISO ? { lte: parseDateOnlyToUTC(dateToISO) } : {}),
            },
          }
        : {}),
    };

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: pageSize,
        include: {
          attachments: true,
          vehicle: { select: { id: true, nickname: true, plate: true } }, // usado na lista
        },
      }),
      prisma.expense.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return NextResponse.json(
      {
        items: expenses,
        page,
        pageSize,
        totalPages,
        totalCount,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro ao listar despesas." },
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
    const validationResult = ExpenseCreateSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao criar despesa.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const {
      vehicleId,
      type,
      status,
      dateISO,
      amount,
      description,
      km,
      fuelLiters,
      pricePerLiter,
      fuelType,
      station,
      attachments,
      vehicleOdometerKm, // obrigatório no form
    } = validationResult.data;

    // 1) Atualiza odômetro total do veículo (Int?) – usa number
    let newOdometerNumber: number | null = null;
    if (typeof vehicleOdometerKm !== "undefined") {
      newOdometerNumber =
        vehicleOdometerKm === null ? null : Number(vehicleOdometerKm);
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { odometerKm: newOdometerNumber },
      });
    }

    // 2) Snapshot de KM salvo na própria despesa:
    //    - se for MANUTENCAO e veio vehicleOdometerKm => salva no campo km (sem migration)
    //    - senão, mantém a lógica anterior (km do formulário)
    const kmToPersist =
      type === "MANUTENCAO" && typeof vehicleOdometerKm !== "undefined"
        ? vehicleOdometerKm
        : km;

    // 3) Cria a despesa
    const createdExpense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        vehicleId,
        type,
        status, // se undefined, Prisma usa default(PENDENTE)
        date: parseDateOnlyToUTC(dateISO),
        amount: new Prisma.Decimal(amount),
        description,
        km:
          typeof kmToPersist !== "undefined"
            ? new Prisma.Decimal(kmToPersist)
            : null,
        fuelLiters:
          typeof fuelLiters !== "undefined"
            ? new Prisma.Decimal(fuelLiters)
            : null,
        pricePerLiter:
          typeof pricePerLiter !== "undefined"
            ? new Prisma.Decimal(pricePerLiter)
            : null,
        fuelType: fuelType ?? null,
        station: station ?? null,
        attachments: attachments
          ? {
              createMany: {
                data: attachments.map((att) => ({
                  url: att.url,
                  contentType: att.contentType ?? null,
                  size: typeof att.size === "number" ? att.size : null,
                })),
              },
            }
          : undefined,
      },
      include: {
        attachments: true,
        vehicle: { select: { id: true, nickname: true, plate: true } },
      },
    });

    // 4) Avalia lembretes por KM para este veículo
    const alerts: Array<{
      id: string;
      title: string;
      status: "DUE_SOON" | "OVERDUE";
      message: string;
    }> = [];

    if (newOdometerNumber != null) {
      const rules = await prisma.reminderRule.findMany({
        where: {
          userId: session.user.id,
          vehicleId,
          isActive: true,
          NOT: { everyKm: null },
        },
        select: {
          id: true,
          title: true,
          everyKm: true,
          lastDoneKm: true,
          warnKmLeft: true,
        },
      });

      for (const r of rules) {
        const baseline =
          r.lastDoneKm == null ? newOdometerNumber : r.lastDoneKm;

        const { status: st, left } = computeKmStatusForRule({
          everyKm: r.everyKm as number,
          lastDoneKm: baseline ?? 0,
          warnKmLeft: (r.warnKmLeft as number) ?? 500,
          currentOdo: newOdometerNumber,
        });

        if (st === "OVERDUE") {
          alerts.push({
            id: r.id,
            title: r.title,
            status: "OVERDUE",
            message: `Venceu por ${Math.abs(left)} km`,
          });
        } else if (st === "DUE_SOON") {
          alerts.push({
            id: r.id,
            title: r.title,
            status: "DUE_SOON",
            message: `Faltam ${left} km`,
          });
        }
      }
    }

    return NextResponse.json({ data: createdExpense, alerts }, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao criar despesa." },
      { status: 500 }
    );
  }
}
