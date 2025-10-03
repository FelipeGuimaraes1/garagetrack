export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** GET /api/expenses?vehicleId=...&type=...&month=YYYY-MM */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const type = searchParams.get("type") || undefined;
  const month = searchParams.get("month") || undefined;

  const where: any = { userId: (session.user as any).id };
  if (vehicleId) where.vehicleId = vehicleId;
  if (type) where.type = type;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 1);
    where.date = { gte: from, lt: to };
  }

  const list = await prisma.expense.findMany({
    where,
    include: {
      attachments: true,
      vehicle: { select: { nickname: true, plate: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(list, { status: 200 });
}

/** POST /api/expenses  -> cria despesa para o usuário logado */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const created = await prisma.expense.create({
    data: {
      userId: (session.user as any).id,
      vehicleId: body.vehicleId,
      type: body.type,
      status: body.status,
      date: new Date(body.date),
      amount: body.amount,
      description: body.description,
      km: body.km ?? null,
      fuelLiters: body.fuelLiters ?? null,
      pricePerLiter: body.pricePerLiter ?? null,
      fuelType: body.fuelType ?? null,
      station: body.station ?? null,
      attachments: body.attachments?.length
        ? {
            create: body.attachments.map((a: any) => ({
              url: a.url,
              contentType: a.contentType ?? null,
              size: a.size ?? null,
            })),
          }
        : undefined,
    },
    include: { attachments: true },
  });

  return NextResponse.json(created, { status: 201 });
}
