import { getCurrentUserId } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { normalizePlate } from "@/lib/utils/formatters";
import { vehicleUpdateSchema } from "@/lib/validations/vehicle";
import { NextResponse } from "next/server";

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    const json = await request.json();
    const parsed = vehicleUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nickname, plate, fuelDefault, odometerKm } = parsed.data;

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: {
        nickname: nickname ?? undefined,
        plate:
          plate !== undefined
            ? plate
              ? normalizePlate(plate)
              : null
            : undefined,
        fuelDefault: fuelDefault ?? undefined,
        odometerKm: odometerKm ?? undefined,
      },
    });

    // Garantia de autorização: pertence ao usuário?
    if (updated.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um veículo com essa placa para este usuário." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Não foi possível atualizar o veículo." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
    });
    if (!vehicle) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 }
      );
    }
    if (vehicle.userId !== userId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    await prisma.vehicle.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { error: "Não foi possível remover o veículo." },
      { status: 500 }
    );
  }
}
