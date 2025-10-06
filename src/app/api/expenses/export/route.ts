export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/utils/db";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

/**
 * Converte "YYYY-MM-DD" para Date UTC (meia-noite).
 * O campo `Expense.date` é @db.Date, então trabalhamos SEM horário.
 */
function parseDateOnlyToUTC(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map((v) => Number(v));
  return new Date(Date.UTC(year, month - 1, day));
}

/** Escapa valores para CSV (aspas duplas dobradas ao aparecerem) */
function csvEscape(raw: unknown): string {
  if (raw == null) return "";
  const value = String(raw);
  if (/[;\n",]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Converte Prisma.Decimal | number | string -> string com ponto como separador decimal */
function decimalToString(value: any): string {
  if (value == null || value === "") return "";
  try {
    return new Prisma.Decimal(value).toString();
  } catch {
    const n = Number(value);
    return Number.isFinite(n) ? String(n) : "";
  }
}

/** Data no formato YYYY-MM-DD a partir de string ou Date */
function toDateISO(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  // gerando em UTC
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Mesmos filtros do GET de listagem
  const vehicleId = searchParams.get("vehicleId") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const dateFromISO = searchParams.get("dateFrom") ?? undefined;
  const dateToISO = searchParams.get("dateTo") ?? undefined;

  // Evita export gigantesca acidental — limite suave de segurança
  const limit = Math.min(Number(searchParams.get("limit") ?? 10000), 100000);

  const where = {
    userId: session.user.id,
    ...(vehicleId ? { vehicleId } : {}),
    ...(type ? { type: type as any } : {}),
    ...(dateFromISO || dateToISO
      ? {
          date: {
            ...(dateFromISO ? { gte: parseDateOnlyToUTC(dateFromISO) } : {}),
            ...(dateToISO ? { lte: parseDateOnlyToUTC(dateToISO) } : {}),
          },
        }
      : {}),
  } as const;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit,
    include: {
      vehicle: { select: { nickname: true, plate: true } },
    },
  });

  // Cabeçalho + linhas
  const header =
    "date;type;status;amount;description;vehicleNickname;vehiclePlate;km;fuelLiters;pricePerLiter;fuelType;station";

  const lines = expenses.map((e) => {
    const date = toDateISO(e.date as unknown as Date);
    const amount = decimalToString(e.amount);
    const km = decimalToString(e.km);
    const fuelLiters = decimalToString(e.fuelLiters);
    const pricePerLiter = decimalToString(e.pricePerLiter);

    return [
      date,
      e.type,
      e.status,
      amount,
      e.description ?? "",
      e.vehicle?.nickname ?? "",
      e.vehicle?.plate ?? "",
      km,
      fuelLiters,
      pricePerLiter,
      e.fuelType ?? "",
      e.station ?? "",
    ]
      .map(csvEscape)
      .join(";");
  });

  // Excel PT-BR: UTF-8 com BOM ajuda a abrir com acentuação correta
  const bom = "\uFEFF";
  const csvContent = [header, ...lines].join("\n");
  const filename = `despesas_${new Date()
    .toISOString()
    .replace(/[:T]/g, "")
    .slice(0, 15)}.csv`;

  return new Response(bom + csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
