export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** PATCH /api/expenses/:id */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const updated = await prisma.expense.update({
    where: { id: params.id, AND: { userId: (session.user as any).id } },
    data: {
      vehicleId: body.vehicleId,
      type: body.type,
      status: body.status,
      date: body.date ? new Date(body.date) : undefined,
      amount: body.amount,
      description: body.description,
      km: body.km ?? null,
      fuelLiters: body.fuelLiters ?? null,
      pricePerLiter: body.pricePerLiter ?? null,
      fuelType: body.fuelType ?? null,
      station: body.station ?? null,
    },
    include: { attachments: true },
  });

  return NextResponse.json(updated, { status: 200 });
}

/** DELETE /api/expenses/:id */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.expense.delete({
    where: { id: params.id, AND: { userId: (session.user as any).id } },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
