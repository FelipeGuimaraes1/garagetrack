import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/** Parse seguro de datas (yyyy-mm-dd ou ISO) */
function parseDateSafe(input: any): Date | undefined {
  if (typeof input !== "string") return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Atualiza uma regra de lembrete do usuário autenticado */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));

  // Garante propriedade
  const owned = await prisma.reminderRule.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owned || owned.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.reminderRule.update({
    where: { id },
    data: {
      vehicleId: body.vehicleId ?? undefined,
      type: body.type ?? undefined,
      title: body.title ?? undefined,
      notes: body.notes ?? undefined,
      everyKm: body.everyKm != null ? Number(body.everyKm) : undefined,
      everyDays: body.everyDays != null ? Number(body.everyDays) : undefined,
      lastDoneKm: body.lastDoneKm != null ? Number(body.lastDoneKm) : undefined,
      lastDoneAt: parseDateSafe(body.lastDoneAt) ?? undefined,
      dueDate: parseDateSafe(body.dueDate) ?? undefined,
      isActive:
        typeof body.isActive === "boolean" ? Boolean(body.isActive) : undefined,
    },
  });

  return NextResponse.json(updated);
}

/** Remove uma regra de lembrete do usuário autenticado */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  const userId = (session.user as any).id;

  // Garante propriedade
  const owned = await prisma.reminderRule.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!owned || owned.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.reminderRule.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
