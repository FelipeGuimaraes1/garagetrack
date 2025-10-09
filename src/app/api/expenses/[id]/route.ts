export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { ExpenseUpdateSchema } from "@/lib/validations/expense";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function parseDateOnlyToUTC(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map((v) => Number(v));
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Next 15+: nas rotas dinâmicas de API, `params` é assíncrono,
 * então tipamos como Promise e usamos `await ctx.params`.
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

    const { id: expenseId } = await ctx.params;

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
      include: { attachments: true },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Despesa não encontrada." },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    const validationResult = ExpenseUpdateSchema.safeParse({
      ...requestBody,
      id: expenseId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao atualizar despesa.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const dataToUpdate = { ...validationResult.data } as any;
    delete dataToUpdate.id;

    // Se vier "vehicleOdometerKm", atualiza o odômetro do veículo
    if (typeof dataToUpdate.vehicleOdometerKm !== "undefined") {
      await prisma.vehicle.update({
        where: { id: dataToUpdate.vehicleId ?? existing.vehicleId },
        data: {
          odometerKm:
            dataToUpdate.vehicleOdometerKm === null
              ? null
              : Number(dataToUpdate.vehicleOdometerKm),
        },
      });
    }

    const prismaData: any = {};

    if (typeof dataToUpdate.vehicleId !== "undefined")
      prismaData.vehicleId = dataToUpdate.vehicleId;
    if (typeof dataToUpdate.type !== "undefined")
      prismaData.type = dataToUpdate.type;
    if (typeof dataToUpdate.status !== "undefined")
      prismaData.status = dataToUpdate.status;
    if (typeof dataToUpdate.dateISO !== "undefined")
      prismaData.date = parseDateOnlyToUTC(dataToUpdate.dateISO);
    if (typeof dataToUpdate.amount !== "undefined")
      prismaData.amount = new Prisma.Decimal(dataToUpdate.amount);
    if (typeof dataToUpdate.description !== "undefined")
      prismaData.description = dataToUpdate.description;
    if (typeof dataToUpdate.km !== "undefined")
      prismaData.km =
        dataToUpdate.km == null ? null : new Prisma.Decimal(dataToUpdate.km);
    if (typeof dataToUpdate.fuelLiters !== "undefined")
      prismaData.fuelLiters =
        dataToUpdate.fuelLiters == null
          ? null
          : new Prisma.Decimal(dataToUpdate.fuelLiters);
    if (typeof dataToUpdate.pricePerLiter !== "undefined")
      prismaData.pricePerLiter =
        dataToUpdate.pricePerLiter == null
          ? null
          : new Prisma.Decimal(dataToUpdate.pricePerLiter);
    if (typeof dataToUpdate.fuelType !== "undefined")
      prismaData.fuelType = dataToUpdate.fuelType ?? null;
    if (typeof dataToUpdate.station !== "undefined")
      prismaData.station = dataToUpdate.station ?? null;

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: prismaData,
      include: { attachments: true },
    });

    return NextResponse.json({ data: updatedExpense }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao atualizar despesa." },
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

    const { id: expenseId } = await ctx.params;

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Despesa não encontrada." },
        { status: 404 }
      );
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json(
      { message: "Despesa excluída com sucesso." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro ao excluir despesa." },
      { status: 500 }
    );
  }
}
