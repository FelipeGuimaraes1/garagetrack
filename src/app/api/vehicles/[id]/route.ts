import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const FuelEnum = z.enum(["GASOLINA", "ETANOL", "DIESEL", "GNV", "FLEX"]);

const updateSchema = z
  .object({
    nickname: z.string().trim().min(1).max(80).optional(),
    plate: z.string().trim().max(12).optional(),
    odometerKm: z.number().int().nonnegative().optional(),
    fuelDefault: FuelEnum.optional(),
  })
  .refine(
    (obj) => Object.keys(obj).length > 0,
    "Envie ao menos um campo para atualizar."
  );

/**
 * Atualiza um veículo do usuário (apenas campos permitidos)
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ValidationError", issues: parsed.error.format() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Garante que o veículo pertence ao usuário
  const updated = await prisma.vehicle.update({
    where: { id: params.id, userId },
    data,
  });

  return NextResponse.json(updated);
}

/**
 * Remove um veículo do usuário
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  await prisma.vehicle.delete({
    where: { id: params.id, userId },
  });

  return NextResponse.json({ ok: true });
}
