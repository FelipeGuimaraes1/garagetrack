export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { findOwnedVehicle } from "@/lib/auth/owned-vehicle";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import {
  abastecimentoFuelIssues,
  ExpenseUpdateSchema,
} from "@/lib/validations/expense";
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

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}

function toOdometerInt(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
}

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
    if (
      !requestBody ||
      typeof requestBody !== "object" ||
      Array.isArray(requestBody)
    ) {
      return NextResponse.json(
        {
          message: "Erro de validação ao atualizar despesa.",
          issues: [{ path: "general", message: "Dados inválidos." }],
        },
        { status: 422 }
      );
    }
    const body = requestBody as Record<string, unknown>;

    const payloadForSchema = {
      vehicleId: body.vehicleId,
      type: emptyStringToUndefined(body.type),
      status: body.status,
      dateISO: body.dateISO,
      amount: body.amount,
      description: body.description,
      km: emptyStringToUndefined(body.km),
      vehicleOdometerKm: emptyStringToUndefined(body.vehicleOdometerKm),
      fuelLiters: emptyStringToUndefined(body.fuelLiters),
      pricePerLiter: emptyStringToUndefined(body.pricePerLiter),
      fuelType: emptyStringToUndefined(body.fuelType),
      station:
        typeof body.station === "string" && body.station.trim() === ""
          ? null
          : body.station,
    };

    const validationResult = ExpenseUpdateSchema.safeParse(payloadForSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao atualizar despesa.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const dataToUpdate = validationResult.data;
    const resultingType = dataToUpdate.type ?? existing.type;
    const targetVehicleId = dataToUpdate.vehicleId ?? existing.vehicleId;
    const ownedVehicle = await findOwnedVehicle(
      session.user.id,
      targetVehicleId
    );
    if (!ownedVehicle) {
      return NextResponse.json(
        { message: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    if (resultingType === "ABASTECIMENTO") {
      const fuelIssues = abastecimentoFuelIssues({
        fuelLiters:
          dataToUpdate.fuelLiters !== undefined
            ? dataToUpdate.fuelLiters
            : existing.fuelLiters,
        pricePerLiter:
          dataToUpdate.pricePerLiter !== undefined
            ? dataToUpdate.pricePerLiter
            : existing.pricePerLiter,
        fuelType:
          dataToUpdate.fuelType !== undefined
            ? dataToUpdate.fuelType
            : existing.fuelType,
      });
      if (fuelIssues.length > 0) {
        return NextResponse.json(
          {
            message: "Erro de validação ao atualizar despesa.",
            issues: fuelIssues,
          },
          { status: 422 }
        );
      }
    }

    let incomingOdometer: number | null = null;
    if (dataToUpdate.vehicleOdometerKm !== undefined) {
      incomingOdometer = toOdometerInt(dataToUpdate.vehicleOdometerKm);
      if (incomingOdometer == null) {
        return NextResponse.json(
          {
            message: "Erro de validação ao atualizar despesa.",
            issues: [
              {
                path: "vehicleOdometerKm",
                message: "Informe um odômetro válido.",
              },
            ],
          },
          { status: 422 }
        );
      }
    }

    // Só o veículo de destino pode avançar. Valor menor, igual ou zero não altera o atual.
    const currentOdo = ownedVehicle.odometerKm ?? null;
    if (
      incomingOdometer != null &&
      incomingOdometer > 0 &&
      (currentOdo == null || incomingOdometer > currentOdo)
    ) {
      await prisma.vehicle.update({
        where: { id: targetVehicleId },
        data: { odometerKm: incomingOdometer },
      });
    }

    const prismaData: Prisma.ExpenseUncheckedUpdateInput = {};

    if (dataToUpdate.vehicleId !== undefined)
      prismaData.vehicleId = dataToUpdate.vehicleId;
    if (dataToUpdate.type !== undefined) prismaData.type = dataToUpdate.type;
    if (dataToUpdate.status !== undefined)
      prismaData.status = dataToUpdate.status;
    if (dataToUpdate.dateISO !== undefined)
      prismaData.date = parseDateOnlyToUTC(dataToUpdate.dateISO);
    if (dataToUpdate.amount !== undefined)
      prismaData.amount = new Prisma.Decimal(dataToUpdate.amount);
    if (dataToUpdate.description !== undefined)
      prismaData.description = dataToUpdate.description;

    if (
      resultingType === "MANUTENCAO" &&
      dataToUpdate.vehicleOdometerKm !== undefined
    ) {
      prismaData.km = new Prisma.Decimal(dataToUpdate.vehicleOdometerKm);
    } else if (dataToUpdate.km !== undefined) {
      prismaData.km =
        dataToUpdate.km == null ? null : new Prisma.Decimal(dataToUpdate.km);
    }

    if (resultingType === "ABASTECIMENTO") {
      if (dataToUpdate.fuelLiters !== undefined) {
        prismaData.fuelLiters = new Prisma.Decimal(dataToUpdate.fuelLiters);
      }
      if (dataToUpdate.pricePerLiter !== undefined) {
        prismaData.pricePerLiter = new Prisma.Decimal(
          dataToUpdate.pricePerLiter
        );
      }
      if (dataToUpdate.fuelType !== undefined)
        prismaData.fuelType = dataToUpdate.fuelType;
      if (dataToUpdate.station !== undefined)
        prismaData.station = dataToUpdate.station;
    } else {
      prismaData.fuelLiters = null;
      prismaData.pricePerLiter = null;
      prismaData.fuelType = null;
      prismaData.station = null;
    }

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
