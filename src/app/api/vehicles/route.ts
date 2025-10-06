export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { buildValidationError } from "@/lib/validations/errors";
import { VehicleCreateSchema } from "@/lib/validations/vehicle";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

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

    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip: pageIndex * pageSize,
        take: pageSize,
      }),
      prisma.vehicle.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({ data: vehicles, totalCount }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Erro ao listar veículos." },
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
    const validationResult = VehicleCreateSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return NextResponse.json(
        buildValidationError(
          "Erro de validação ao criar veículo.",
          validationResult.error.issues
        ),
        { status: 422 }
      );
    }

    const { nickname, plate, odometerKm, fuelDefault } = validationResult.data;

    const createdVehicle = await prisma.vehicle.create({
      data: {
        userId: session.user.id,
        nickname: nickname ?? null,
        plate: plate ?? null,
        odometerKm: typeof odometerKm === "number" ? odometerKm : null,
        fuelDefault: fuelDefault ?? null,
      },
    });

    return NextResponse.json({ data: createdVehicle }, { status: 201 });
  } catch (error: any) {
    // Violação de unique (plate por usuário)
    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          message: "Erro de validação ao criar veículo.",
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
      { message: "Erro ao criar veículo." },
      { status: 500 }
    );
  }
}
