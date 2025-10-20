export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { VehicleUpdateSchema } from "@/lib/validations/vehicle";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Next 15+: nas rotas dinâmicas de API, `params` é assíncrono,
 * então tipamos como Promise e usamos `await` para obter o id.
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

    const { id: vehicleId } = await ctx.params;

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

    // 🔒 Proteção: hodômetro nunca diminui e não é zerado por PATCH
    const updateData: any = {
      nickname:
        typeof dataToUpdate.nickname !== "undefined"
          ? dataToUpdate.nickname
          : existing.nickname,
      plate:
        typeof dataToUpdate.plate !== "undefined"
          ? dataToUpdate.plate
          : existing.plate,
      fuelDefault:
        typeof dataToUpdate.fuelDefault !== "undefined"
          ? dataToUpdate.fuelDefault
          : existing.fuelDefault,
    };

    if (typeof dataToUpdate.odometerKm !== "undefined") {
      const incoming = dataToUpdate.odometerKm;
      const current = existing.odometerKm;

      if (typeof incoming === "number") {
        if (current == null || incoming > current) {
          updateData.odometerKm = incoming; // sobe apenas se aumentar
        } else {
          // ignora silenciosamente tentativas de reduzir/igualar
          updateData.odometerKm = current;
        }
      } else if (incoming === null) {
        // não permitir zerar via PATCH; mantém o atual
        updateData.odometerKm = current;
      }
    } else {
      updateData.odometerKm = existing.odometerKm;
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: updateData,
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

export async function DELETE(_request: Request, ctx: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const { id: vehicleId } = await ctx.params;

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
