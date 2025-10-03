export const runtime = "nodejs";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** PATCH /api/vehicles/:id  */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const updated = await prisma.vehicle.update({
    where: { id: params.id, AND: { userId: (session.user as any).id } },
    data: {
      nickname: body.nickname ?? null,
      plate: body.plate ?? null,
      odometerKm: body.odometerKm ?? null,
      fuelDefault: body.fuelDefault ?? null,
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

/** DELETE /api/vehicles/:id */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.vehicle.delete({
    where: { id: params.id, AND: { userId: (session.user as any).id } },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
