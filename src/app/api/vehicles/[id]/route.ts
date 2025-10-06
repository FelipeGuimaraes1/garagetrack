export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { VehicleUpdateSchema } from "@/lib/validations/vehicle";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const vehicleId = context.params.id;
    const existing = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    const requestBody = await request.json();
    const validationResult = VehicleUpdateSchema.safeParse({
      ...requestBody,
      id: vehicleId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao atualizar veículo.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const dataToUpdate = { ...validationResult.data } as any;
    delete dataToUpdate.id;

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        nickname:
          typeof dataToUpdate.nickname !== "undefined"
            ? dataToUpdate.nickname
            : existing.nickname,
        plate:
          typeof dataToUpdate.plate !== "undefined"
            ? dataToUpdate.plate
            : existing.plate,
        odometerKm:
          typeof dataToUpdate.odometerKm !== "undefined"
            ? dataToUpdate.odometerKm
            : existing.odometerKm,
        fuelDefault:
          typeof dataToUpdate.fuelDefault !== "undefined"
            ? dataToUpdate.fuelDefault
            : existing.fuelDefault,
      },
    });

    return NextResponse.json({ data: updatedVehicle }, { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          message: "Erro de validação ao atualizar veículo.",
          issues: [
            {
              path: "plate",
              message: "Você já possui um veículo com esta placa.",
            },
          ],
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { message: "Erro ao atualizar veículo." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const vehicleId = context.params.id;
    const existing = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "Veículo não encontrado." },
        { status: 404 }
      );
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });

    return NextResponse.json(
      { message: "Veículo excluído com sucesso." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erro ao excluir veículo." },
      { status: 500 }
    );
  }
}
