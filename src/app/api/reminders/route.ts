export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

/** Parse seguro para datas vinda do cliente.
 *  Aceita "yyyy-mm-dd" ou ISO completo. Retorna Date ou undefined.
 */
function parseDateSafe(input: any): Date | undefined {
  if (typeof input !== "string") return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const items = await prisma.reminderRule.findMany({
    where: { userId, isActive: true },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items, { status: 200 });
}

/** POST /api/reminders
 *  Cria uma regra de lembrete para o usuário autenticado.
 *  Campos aceitos (todos opcionais além de title/type):
 *   - vehicleId
 *   - type ("OIL_CHANGE" | "SERVICE" | "DOCUMENT" | "FINE" | "CUSTOM")
 *   - title (string)
 *   - notes (string)
 *   - everyKm (number)
 *   - everyDays (number)
 *   - lastDoneKm (number)
 *   - lastDoneAt ("yyyy-mm-dd" ou ISO)
 *   - dueDate ("yyyy-mm-dd" ou ISO)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await req.json().catch(() => ({} as any));

  // Coerções leves (evita 500 por tipos errados vindos do cliente)
  const data = {
    userId,
    vehicleId: body.vehicleId ?? null,
    type: body.type, // validado pelo Prisma enum
    title: body.title,
    notes: body.notes ?? null,
    everyKm: body.everyKm != null ? Number(body.everyKm) : null,
    everyDays: body.everyDays != null ? Number(body.everyDays) : null,
    lastDoneKm: body.lastDoneKm != null ? Number(body.lastDoneKm) : null,
    lastDoneAt: parseDateSafe(body.lastDoneAt) ?? null,
    dueDate: parseDateSafe(body.dueDate) ?? null,
    // por padrão um lembrete novo é ativo
    isActive: true,
  } as const;

  // Cria a regra
  const created = await prisma.reminderRule.create({ data });

  return NextResponse.json(created, { status: 201 });
}
