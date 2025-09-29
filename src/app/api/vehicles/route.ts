import { getCurrentUserId } from "@/lib/auth/get-current-user";
import { prisma } from "@/lib/db";
import { normalizePlate } from "@/lib/utils/formatters";
import { vehicleCreateSchema } from "@/lib/validations/vehicle";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const vehicles = await prisma.vehicle.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: vehicles });
  } catch (error) {
    return NextResponse.json(
      { error: "Não foi possível listar os veículos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const json = await request.json();
    const parsed = vehicleCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { nickname, plate, fuelDefault, odometerKm } = parsed.data;

    const created = await prisma.vehicle.create({
      data: {
        userId,
        nickname: nickname ?? null,
        plate: plate ? normalizePlate(plate) : null,
        fuelDefault: fuelDefault ?? null,
        odometerKm: odometerKm ?? null,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    // Trata violação de unique (placa por usuário)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um veículo com essa placa para este usuário." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Não foi possível criar o veículo." },
      { status: 500 }
    );
  }
}
