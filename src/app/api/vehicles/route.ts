import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const FuelEnum = z.enum(["GASOLINA", "ETANOL", "DIESEL", "GNV", "FLEX"]);

const baseVehicleSchema = z.object({
  nickname: z.string().trim().min(1).max(80).optional(),
  plate: z.string().trim().max(12).optional(), // você valida o formato em outro lugar se quiser
  odometerKm: z.number().int().nonnegative().optional(),
  fuelDefault: FuelEnum.optional(),
});

/**
 * Lista veículos do usuário autenticado
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const list = await prisma.vehicle.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(list);
}

/**
 * Cria veículo para o usuário autenticado
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const json = await req.json().catch(() => null);
  const parsed = baseVehicleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const created = await prisma.vehicle.create({
    data: {
      userId,
      nickname: data.nickname ?? null,
      plate: data.plate ?? null,
      odometerKm: data.odometerKm ?? null,
      fuelDefault: data.fuelDefault ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
