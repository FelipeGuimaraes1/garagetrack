import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** GET /api/vehicles  -> lista veículos do usuário logado */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.vehicle.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(list, { status: 200 });
}

/** POST /api/vehicles  -> cria veículo para o usuário */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const created = await prisma.vehicle.create({
    data: {
      userId: (session.user as any).id,
      nickname: body.nickname || null,
      plate: body.plate || null,
      odometerKm: body.odometerKm ?? null,
      fuelDefault: body.fuelDefault ?? null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
