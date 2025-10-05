import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Atualiza uma despesa do usuário autenticado
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const body = await req.json().catch(() => ({}));
  const userId = (session.user as any).id;

  // Garante que a despesa pertence ao usuário
  const owned = await prisma.expense.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owned || owned.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Normaliza date: aceitar "YYYY-MM-DD" ou Date/ISO completo
  let dateField: Date | undefined;
  if (typeof body.date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      dateField = new Date(`${body.date}T00:00:00.000Z`);
    } else {
      const d = new Date(body.date);
      if (!Number.isNaN(d.getTime())) dateField = d;
    }
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      vehicleId: body.vehicleId ?? undefined,
      type: body.type ?? undefined,
      status: body.status ?? undefined,
      date: dateField ?? undefined,
      amount: body.amount ?? undefined,
      description: body.description ?? undefined,
      km: body.km ?? undefined,
      fuelLiters: body.fuelLiters ?? undefined,
      pricePerLiter: body.pricePerLiter ?? undefined,
      fuelType: body.fuelType ?? undefined,
      station: body.station ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

/**
 * Remove uma despesa do usuário autenticado
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const userId = (session.user as any).id;

  // Garante posse antes de deletar
  const owned = await prisma.expense.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owned || owned.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
